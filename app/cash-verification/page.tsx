'use client'

import { useState, useEffect, useCallback } from 'react'
import MainLayout from '@/components/MainLayout'
import DateSelector from '@/components/DateSelector'
import { useFacility } from '@/contexts/FacilityContext'

interface CashDenomination {
  value: number
  label: string
  count: number
  amount: number
}

interface Facility {
  id: number
  name: string
  isActive: boolean
}

const BILL_DENOMINATIONS: CashDenomination[] = [
  { value: 10000, label: '10,000円', count: 0, amount: 0 },
  { value: 5000, label: '5,000円', count: 0, amount: 0 },
  { value: 2000, label: '2,000円', count: 0, amount: 0 },
  { value: 1000, label: '1,000円', count: 0, amount: 0 },
]

const COIN_DENOMINATIONS: CashDenomination[] = [
  { value: 500, label: '500円', count: 0, amount: 0 },
  { value: 100, label: '100円', count: 0, amount: 0 },
  { value: 50, label: '50円', count: 0, amount: 0 },
  { value: 10, label: '10円', count: 0, amount: 0 },
  { value: 5, label: '5円', count: 0, amount: 0 },
  { value: 1, label: '1円', count: 0, amount: 0 },
]

export default function CashVerificationPage() {
  const { selectedFacilityId: globalSelectedFacilityId } = useFacility()
  const [localSelectedFacilityId, setLocalSelectedFacilityId] = useState<number | null>(null)
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [facilityBalance, setFacilityBalance] = useState(0)
  const [facilityName, setFacilityName] = useState('')
  const [bills, setBills] = useState<CashDenomination[]>(BILL_DENOMINATIONS)
  const [coins, setCoins] = useState<CashDenomination[]>(COIN_DENOMINATIONS)
  const [isLoading, setIsLoading] = useState(false)

  // グローバルに選択されている施設がある場合はそれを使用、なければローカル選択を使用
  const selectedFacilityId = globalSelectedFacilityId || localSelectedFacilityId

  // 施設一覧を取得
  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const response = await fetch('/api/facilities')
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        // エラーオブジェクトの場合は空配列を設定
        if (data.error || !Array.isArray(data)) {
          console.error('Failed to fetch facilities:', data.error || 'Invalid response format')
          setFacilities([])
          return
        }
        // 配列であることを確認してからfilterを呼び出す
        const facilitiesArray = Array.isArray(data) ? data : []
        setFacilities(facilitiesArray.filter((f: Facility) => f.isActive))
      } catch (error) {
        console.error('Failed to fetch facilities:', error)
        setFacilities([])
      }
    }
    fetchFacilities()
  }, [])

  const fetchFacilityInfo = useCallback(async () => {
    if (!selectedFacilityId) return
    
    try {
      const response = await fetch(`/api/facilities/${selectedFacilityId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch facility info')
      }
      const data = await response.json()
      setFacilityName(data.name || '')
    } catch (error) {
      console.error('Failed to fetch facility info:', error)
    }
  }, [selectedFacilityId])

  const fetchFacilityBalance = useCallback(async () => {
    if (!selectedFacilityId) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/facilities/${selectedFacilityId}?year=${year}&month=${month}`)
      if (!response.ok) {
        throw new Error('Failed to fetch facility balance')
      }
      const data = await response.json()
      setFacilityBalance(data.totalAmount || 0)
    } catch (error) {
      console.error('Failed to fetch facility balance:', error)
      alert('施設残高の取得に失敗しました')
      setFacilityBalance(0)
    } finally {
      setIsLoading(false)
    }
  }, [selectedFacilityId, year, month])

  useEffect(() => {
    if (selectedFacilityId) {
      fetchFacilityBalance()
      fetchFacilityInfo()
    } else {
      setFacilityBalance(0)
      setFacilityName('')
    }
  }, [selectedFacilityId, fetchFacilityBalance, fetchFacilityInfo])

  const handleDateChange = (newYear: number, newMonth: number) => {
    setYear(newYear)
    setMonth(newMonth)
  }

  const handleBillCountChange = (index: number, count: number) => {
    const newBills = [...bills]
    newBills[index].count = Math.max(0, count)
    newBills[index].amount = newBills[index].count * newBills[index].value
    setBills(newBills)
  }

  const handleCoinCountChange = (index: number, count: number) => {
    const newCoins = [...coins]
    newCoins[index].count = Math.max(0, count)
    newCoins[index].amount = newCoins[index].count * newCoins[index].value
    setCoins(newCoins)
  }

  const billSubtotal = bills.reduce((sum, bill) => sum + bill.amount, 0)
  const coinSubtotal = coins.reduce((sum, coin) => sum + coin.amount, 0)
  const totalAmount = billSubtotal + coinSubtotal
  const totalCount = bills.reduce((sum, bill) => sum + bill.count, 0) + coins.reduce((sum, coin) => sum + coin.count, 0)
  const difference = facilityBalance - totalAmount

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const resetCounts = () => {
    setBills(BILL_DENOMINATIONS.map(b => ({ ...b, count: 0, amount: 0 })))
    setCoins(COIN_DENOMINATIONS.map(c => ({ ...c, count: 0, amount: 0 })))
  }

  return (
    <MainLayout>
      <div>
        <h1 className="text-3xl font-bold mb-6">現金確認</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          {!globalSelectedFacilityId && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                施設選択
              </label>
              <select
                value={localSelectedFacilityId || ''}
                onChange={(e) => setLocalSelectedFacilityId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">施設を選択してください</option>
                {facilities.map(facility => (
                  <option key={facility.id} value={facility.id}>
                    {facility.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <DateSelector year={year} month={month} onDateChange={handleDateChange} />
        </div>

        {selectedFacilityId ? (
          <>
            {/* 施設別残額合計 */}
            <div className="bg-green-500 text-white rounded-lg shadow-md p-6 mb-6">
              <div className="text-lg font-semibold mb-2">利用者別残額合計</div>
              <div className="text-3xl font-bold">
                {isLoading ? '読み込み中...' : formatCurrency(facilityBalance)}
              </div>
              {facilityName && (
                <div className="text-sm mt-2 opacity-90">
                  {facilityName}
                </div>
              )}
            </div>

            {/* 紙幣入力セクション */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">紙幣</h2>
                <button
                  onClick={resetCounts}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                >
                  リセット
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">額面</th>
                      <th className="text-center py-2 px-4 w-32">枚数</th>
                      <th className="text-right py-2 px-4 w-40">金額</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.map((bill, index) => (
                      <tr key={bill.value} className="border-b">
                        <td className="py-2 px-4">{bill.label}</td>
                        <td className="py-2 px-4">
                          <input
                            type="number"
                            min="0"
                            value={bill.count || ''}
                            onChange={(e) => handleBillCountChange(index, parseInt(e.target.value) || 0)}
                            className="w-full px-2 py-1 border border-yellow-300 rounded bg-yellow-50 text-center"
                            placeholder="0"
                          />
                        </td>
                        <td className="py-2 px-4 text-right font-mono">
                          {formatCurrency(bill.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-400 font-semibold">
                      <td colSpan={2} className="py-2 px-4 text-right">小計</td>
                      <td className="py-2 px-4 text-right font-mono">
                        {formatCurrency(billSubtotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* 硬貨入力セクション */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="bg-green-100 px-4 py-2 mb-4 rounded">
                <span className="font-semibold text-green-800">【本】</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">額面</th>
                      <th className="text-center py-2 px-4 w-32">枚数</th>
                      <th className="text-right py-2 px-4 w-40">金額</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coins.map((coin, index) => (
                      <tr key={coin.value} className="border-b">
                        <td className="py-2 px-4">{coin.label}</td>
                        <td className="py-2 px-4">
                          <input
                            type="number"
                            min="0"
                            value={coin.count || ''}
                            onChange={(e) => handleCoinCountChange(index, parseInt(e.target.value) || 0)}
                            className="w-full px-2 py-1 border border-yellow-300 rounded bg-yellow-50 text-center"
                            placeholder="0"
                          />
                        </td>
                        <td className="py-2 px-4 text-right font-mono">
                          {formatCurrency(coin.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-400 font-semibold">
                      <td colSpan={2} className="py-2 px-4 text-right">小計</td>
                      <td className="py-2 px-4 text-right font-mono">
                        {formatCurrency(coinSubtotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* 合計・差異表示 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">計</div>
                  <div className="text-2xl font-bold text-green-800">
                    {totalCount.toLocaleString()}枚
                  </div>
                </div>
                <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">差異</div>
                  <div className={`text-2xl font-bold ${difference === 0 ? 'text-green-600' : difference > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                    {formatCurrency(difference)}
                  </div>
                </div>
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">利用者別残額合計</div>
                  <div className="text-xl font-bold text-green-800 mb-2">
                    {formatCurrency(facilityBalance)}
                  </div>
                  <div className="text-sm text-gray-600 mb-1">合計</div>
                  <div className="text-2xl font-bold text-green-800">
                    {formatCurrency(totalAmount)}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
            施設を選択してください。サイドバーから「施設選択」を選択して施設を選択してください。
          </div>
        )}
      </div>
    </MainLayout>
  )
}
