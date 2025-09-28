-- Migration pour corriger le probleme d'enum user_role

-- 1. S'assurer que l'enum user_role existe
DO $$ 
BEGIN
    -- Verifier si l'enum existe
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        -- Creer l'enum s'il n'existe pas
        CREATE TYPE user_role AS ENUM ('agriculteur', 'cooperative', 'preteur', 'admin');
        RAISE NOTICE 'Enum user_role cree';
    END IF;
END $$;

-- 2. Recreer la fonction handle_new_user avec une meilleure gestion d'erreur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role_value text;
    max_retries INTEGER := 3;
    retry_count INTEGER := 0;
    success BOOLEAN := false;
BEGIN
    -- Recuperer le role depuis les metadonnees utilisateur
    user_role_value := COALESCE(NEW.raw_user_meta_data->>'role', 'agriculteur');
    
    -- Valider que le role est valide
    IF user_role_value NOT IN ('agriculteur', 'cooperative', 'preteur', 'admin') THEN
        user_role_value := 'agriculteur';
    END IF;
    
    -- Log pour debug
    RAISE NOTICE 'Creation profil pour user: %, role: %', NEW.id, user_role_value;
    
    -- Attendre un peu pour que l'user soit bien cree dans auth.users
    PERFORM pg_sleep(0.1);
    
    -- Boucle de retry
    WHILE retry_count < max_retries AND NOT success LOOP
        BEGIN
            -- Verifier si le profil existe deja
            IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
                -- Tentative d'insertion
                INSERT INTO public.profiles (id, role, is_validated)
                VALUES (
                    NEW.id,
                    user_role_value::user_role,
                    user_role_value != 'agriculteur'
                );
                
                RAISE NOTICE 'Profil cree avec succes pour user: %', NEW.id;
            ELSE
                RAISE NOTICE 'Profil existe deja pour user: %', NEW.id;
            END IF;
            
            success := true;
            
        EXCEPTION
            WHEN foreign_key_violation THEN
                retry_count := retry_count + 1;
                IF retry_count < max_retries THEN
                    RAISE NOTICE 'Retry % pour user: %', retry_count, NEW.id;
                    PERFORM pg_sleep(0.2 * retry_count);
                ELSE
                    RAISE EXCEPTION 'Echec creation profil apres % tentatives pour user: % - Foreign key violation', 
                        max_retries, NEW.id;
                END IF;
                
            WHEN invalid_text_representation THEN
                RAISE EXCEPTION 'Role invalide "%" pour user: %', user_role_value, NEW.id;
                
            WHEN undefined_object THEN
                RAISE EXCEPTION 'Type user_role non defini pour user: %', NEW.id;
                
            WHEN unique_violation THEN
                -- Le profil existe deja, c'est OK
                RAISE NOTICE 'Profil existe deja pour user: % (unique violation)', NEW.id;
                success := true;
                
            WHEN OTHERS THEN
                RAISE EXCEPTION 'Erreur inattendue pour user %: % (SQLSTATE: %)', 
                    NEW.id, SQLERRM, SQLSTATE;
        END;
    END LOOP;
    
    RETURN NEW;
END;
$$;

-- 3. Recreer le trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 4. Verifier que tout est en place
DO $$
BEGIN
    -- Verifier l'enum
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        RAISE NOTICE 'Enum user_role: OK';
    ELSE
        RAISE EXCEPTION 'Enum user_role: MANQUANT';
    END IF;
    
    -- Verifier la fonction
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
        RAISE NOTICE 'Fonction handle_new_user: OK';
    ELSE
        RAISE EXCEPTION 'Fonction handle_new_user: MANQUANTE';
    END IF;
    
    -- Verifier le trigger
    IF EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created') THEN
        RAISE NOTICE 'Trigger on_auth_user_created: OK';
    ELSE
        RAISE EXCEPTION 'Trigger on_auth_user_created: MANQUANT';
    END IF;
END $$;