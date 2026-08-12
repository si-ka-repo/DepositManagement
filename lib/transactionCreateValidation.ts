import { BUSINESS_TIME_ZONE, formatJapanCalendarDate, getZonedCalendarParts } from '@/lib/calendarDate'
import {
  getInOutDateRange,
  inOutDateRangeErrorMessage,
} from '@/lib/bulkInputPageUtils'
import { isValidDate, validateMaxLength, MAX_LENGTHS } from '@/lib/validation'

/** 単一 POST / バッチ POST で共通の取引作成ペイロード（正規化後） */
export type TransactionCreatePayload = {
  residentId: number
  transactionDate: Date
  transactionType: string
  amount: number
  description: string | null
  payee: string | null
  reason: string | null
}

/**
 * 取引作成 API と同じバリデーション。
 * 成功時は Prisma create に渡せる形に正規化する。
 */
export function validateTransactionCreateBody(
  body: Record<string, unknown>
): { ok: true; data: TransactionCreatePayload } | { ok: false; error: string } {
  if (
    body.residentId === undefined ||
    body.residentId === null ||
    body.transactionDate === undefined ||
    body.transactionDate === null ||
    body.transactionType === undefined ||
    body.transactionType === null ||
    body.amount === undefined ||
    body.amount === null
  ) {
    return { ok: false, error: 'Missing required fields' }
  }

  if (!isValidDate(String(body.transactionDate))) {
    return { ok: false, error: '無効な日付形式です' }
  }

  const transactionType = String(body.transactionType)

  if (
    (transactionType === 'past_correct_in' || transactionType === 'past_correct_out') &&
    (!body.reason || String(body.reason).trim() === '')
  ) {
    return { ok: false, error: 'Reason is required for past correction transactions' }
  }

  const transactionDate = new Date(String(body.transactionDate))
  const transactionDateStr = formatJapanCalendarDate(transactionDate)
  const { year: cy, month: cm, day: cd } = getZonedCalendarParts(new Date(), BUSINESS_TIME_ZONE)

  if (transactionType === 'in' || transactionType === 'out') {
    const { min: minDate, max: maxDate } = getInOutDateRange()

    if (transactionDateStr < minDate || transactionDateStr > maxDate) {
      return { ok: false, error: inOutDateRangeErrorMessage(cd) }
    }
  }

  if (transactionType === 'past_correct_in' || transactionType === 'past_correct_out') {
    const { year: ty, month: tm } = getZonedCalendarParts(transactionDate, BUSINESS_TIME_ZONE)
    if (ty > cy || (ty === cy && tm >= cm)) {
      return { ok: false, error: '過去訂正入力は過去の月の日付のみ入力できます' }
    }
  }

  const description = body.description !== undefined && body.description !== null ? String(body.description) : ''
  const payee = body.payee !== undefined && body.payee !== null ? String(body.payee) : ''
  const reason = body.reason !== undefined && body.reason !== null ? String(body.reason) : ''

  if (description && !validateMaxLength(description, MAX_LENGTHS.TRANSACTION_DESCRIPTION)) {
    return { ok: false, error: `内容（備考）は${MAX_LENGTHS.TRANSACTION_DESCRIPTION}文字以内で入力してください` }
  }
  if (payee && !validateMaxLength(payee, MAX_LENGTHS.TRANSACTION_PAYEE)) {
    return { ok: false, error: `支払先は${MAX_LENGTHS.TRANSACTION_PAYEE}文字以内で入力してください` }
  }
  if (reason && !validateMaxLength(reason, MAX_LENGTHS.TRANSACTION_REASON)) {
    return { ok: false, error: `理由は${MAX_LENGTHS.TRANSACTION_REASON}文字以内で入力してください` }
  }

  const amount = Number(body.amount)
  if (Number.isNaN(amount)) {
    return { ok: false, error: 'Invalid amount' }
  }

  const residentId = Number(body.residentId)
  if (Number.isNaN(residentId)) {
    return { ok: false, error: 'Invalid residentId' }
  }

  return {
    ok: true,
    data: {
      residentId,
      transactionDate,
      transactionType,
      amount,
      description: description.trim() ? description.trim() : null,
      payee: payee.trim() ? payee.trim() : null,
      reason: reason.trim() ? reason.trim() : null,
    },
  }
}
