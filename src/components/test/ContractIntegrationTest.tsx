'use client';

import React, { useState } from 'react';
import { useMazaoContracts } from '@/hooks/useMazaoContracts';
import { Card } from '@/components/ui/Card';

export function ContractIntegrationTest() {
  const {
    loading,
    error,
    createCropToken,
    mintTokens,
    getFarmerBalanceForToken,
    getFarmerTotalBalance,
    getTokenDetails,
    requestLoan,
    getLoanDetails,
    getNextTokenId,
    getNextLoanId,
    tokenizeEvaluation
  } = useMazaoContracts();

  const [results, setResults] = useState<any[]>([]);
  const [testData, setTestData] = useState({
    farmerAddress: '0x55f02d61b4d93607880e1382125cffef11239d53',
    cropType: 'manioc',
    estimatedValue: 1000,
    tokenSymbol: 'MANIOC-TEST',
    tokenId: '1',
    loanId: '1',
    principal: 500,
    duration: 6,
    interestRate: 8
  });

  const addResult = (test: string, result: any) => {
    setResults(prev => [...prev, { 
      test, 
      result, 
      timestamp: new Date().toLocaleTimeString() 
    }]);
  };

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    try {
      const result = await testFn();
      addResult(testName, { success: true, data: result });
    } catch (err) {
      addResult(testName, { success: false, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  };

  const tests = [
    {
      name: 'Get Next Token ID',
      fn: () => getNextTokenId()
    },
    {
      name: 'Get Next Loan ID', 
      fn: () => getNextLoanId()
    },
    {
      name: 'Create Crop Token',
      fn: () => createCropToken(
        testData.farmerAddress,
        testData.estimatedValue,
        testData.cropType,
        Date.now() + 90 * 24 * 60 * 60 * 1000, // 90 days from now
        testData.tokenSymbol
      )
    },
    {
      name: 'Mint Tokens',
      fn: () => mintTokens(
        testData.tokenId,
        testData.estimatedValue,
        testData.farmerAddress
      )
    },
    {
      name: 'Get Farmer Balance for Token',
      fn: () => getFarmerBalanceForToken(testData.farmerAddress, testData.tokenId)
    },
    {
      name: 'Get Farmer Total Balance',
      fn: () => getFarmerTotalBalance(testData.farmerAddress)
    },
    {
      name: 'Get Token Details',
      fn: () => getTokenDetails(testData.tokenId)
    },
    {
      name: 'Request Loan',
      fn: () => requestLoan(
        testData.tokenId,
        testData.principal,
        testData.duration,
        testData.interestRate
      )
    },
    {
      name: 'Get Loan Details',
      fn: () => getLoanDetails(testData.loanId)
    },
    {
      name: 'Complete Tokenization',
      fn: () => tokenizeEvaluation(
        'test-evaluation-id',
        testData.cropType,
        'test-farmer-id',
        testData.farmerAddress,
        testData.estimatedValue,
        Date.now() + 90 * 24 * 60 * 60 * 1000
      )
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🧪 MazaoChain Contract Integration Test
        </h1>
        <p className="text-gray-600">
          Test the integration between Next.js frontend and deployed smart contracts
        </p>
      </div>

      {/* Test Configuration */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Farmer Address
            </label>
            <input
              type="text"
              value={testData.farmerAddress}
              onChange={(e) => setTestData(prev => ({ ...prev, farmerAddress: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Crop Type
            </label>
            <input
              type="text"
              value={testData.cropType}
              onChange={(e) => setTestData(prev => ({ ...prev, cropType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estimated Value
            </label>
            <input
              type="number"
              value={testData.estimatedValue}
              onChange={(e) => setTestData(prev => ({ ...prev, estimatedValue: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Token ID (for queries)
            </label>
            <input
              type="text"
              value={testData.tokenId}
              onChange={(e) => setTestData(prev => ({ ...prev, tokenId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Test Controls */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Contract Tests</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {tests.map((test, index) => (
            <button
              key={index}
              onClick={() => runTest(test.name, test.fn)}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {test.name}
            </button>
          ))}
        </div>
        
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => setResults([])}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
          >
            Clear Results
          </button>
          <button
            onClick={async () => {
              for (const test of tests.slice(0, 3)) {
                await runTest(test.name, test.fn);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between tests
              }
            }}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
          >
            Run Basic Tests
          </button>
        </div>
      </Card>

      {/* Loading & Error States */}
      {loading && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-blue-800">Executing contract interaction...</span>
          </div>
        </Card>
      )}

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="text-red-800">
            <strong>Error:</strong> {error}
          </div>
        </Card>
      )}

      {/* Test Results */}
      {results.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-md border ${
                  result.result.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900">{result.test}</h3>
                  <span className="text-xs text-gray-500">{result.timestamp}</span>
                </div>
                
                {result.result.success ? (
                  <div className="text-green-800">
                    <div className="text-sm">✅ Success</div>
                    <pre className="mt-2 text-xs bg-green-100 p-2 rounded overflow-x-auto">
                      {JSON.stringify(result.result.data, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="text-red-800">
                    <div className="text-sm">❌ Failed</div>
                    <div className="mt-1 text-sm">{result.result.error}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Contract Information */}
      <Card className="p-6 bg-gray-50">
        <h2 className="text-xl font-semibold mb-4">Contract Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Network:</strong> {process.env.NEXT_PUBLIC_HEDERA_NETWORK}
          </div>
          <div>
            <strong>Account:</strong> {process.env.NEXT_PUBLIC_HEDERA_ACCOUNT_ID}
          </div>
          <div>
            <strong>TokenFactory:</strong> {process.env.NEXT_PUBLIC_MAZAO_TOKEN_FACTORY_CONTRACT_ID}
          </div>
          <div>
            <strong>LoanManager:</strong> {process.env.NEXT_PUBLIC_LOAN_MANAGER_CONTRACT_ID}
          </div>
        </div>
      </Card>
    </div>
  );
}