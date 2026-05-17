// lib/utils.ts
export function generateShareUrl(): string {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
}

export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

// 割り勘計算ロジック
export interface Settlement {
  from: string
  to: string
  amount: number
}

export function calculateSettlements(
  members: Array<{ id: string; name: string }>,
  items: Array<{ memberId: string; amount: number }>
): Settlement[] {
  // メンバごとの支払い額を計算
  const memberTotals: { [key: string]: number } = {}
  members.forEach(member => {
    memberTotals[member.id] = 0
  })

  items.forEach(item => {
    memberTotals[item.memberId] += item.amount
  })

  // 全体の平均額を計算
  const totalAmount = Object.values(memberTotals).reduce((a, b) => a + b, 0)
  const averageAmount = totalAmount / members.length

  // 各メンバの収支を計算
  const balances = members.map(member => ({
    id: member.id,
    name: member.name,
    balance: memberTotals[member.id] - averageAmount
  }))

  // 収支がプラス（返金対象）とマイナス（支払い対象）に分ける
  const debtors = balances.filter(b => b.balance < 0).sort((a, b) => a.balance - b.balance)
  const creditors = balances.filter(b => b.balance > 0).sort((a, b) => b.balance - a.balance)

  const settlements: Settlement[] = []

  for (const debtor of debtors) {
    let amountNeeded = Math.abs(debtor.balance)

    for (const creditor of creditors) {
      if (creditor.balance <= 0.01) continue

      const amountToTransfer = Math.min(amountNeeded, creditor.balance)

      settlements.push({
        from: debtor.name,
        to: creditor.name,
        amount: Math.round(amountToTransfer * 100) / 100
      })

      debtor.balance += amountToTransfer
      creditor.balance -= amountToTransfer
      amountNeeded -= amountToTransfer

      if (amountNeeded < 0.01) break
    }
  }

  return settlements.filter(s => s.amount > 0.01)
}
