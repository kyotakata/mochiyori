export function generateShareUrl(): string {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

export interface Settlement {
  from: string
  to: string
  amount: number
}

interface SplitMember {
  member: { id: string; name: string }
}

export function calculateSettlements(
  members: Array<{ id: string; name: string }>,
  items: Array<{
    memberId: string
    amount: number
    splitAmong?: SplitMember[]
  }>
): Settlement[] {
  const memberMap = new Map(members.map(m => [m.id, m.name]))
  const balances = new Map<string, number>()
  members.forEach(m => balances.set(m.id, 0))

  items.forEach(item => {
    const selectedMembers = item.splitAmong?.length
      ? item.splitAmong.map(s => s.member)
      : []

    let splitTargets: Array<{ id: string; name: string }>
    if (selectedMembers.length > 0) {
      const includedIds = new Set(selectedMembers.map(m => m.id))
      includedIds.add(item.memberId)
      splitTargets = members.filter(m => includedIds.has(m.id))
    } else {
      splitTargets = members
    }

    const perPerson = item.amount / splitTargets.length

    splitTargets.forEach(target => {
      const current = balances.get(target.id) || 0
      balances.set(target.id, current - perPerson)
    })

    const payerCurrent = balances.get(item.memberId) || 0
    balances.set(item.memberId, payerCurrent + item.amount)
  })

  const debtors: { id: string; name: string; balance: number }[] = []
  const creditors: { id: string; name: string; balance: number }[] = []

  balances.forEach((balance, id) => {
    const name = memberMap.get(id) || 'Unknown'
    if (balance < -0.01) debtors.push({ id, name, balance })
    else if (balance > 0.01) creditors.push({ id, name, balance })
  })

  debtors.sort((a, b) => a.balance - b.balance)
  creditors.sort((a, b) => b.balance - a.balance)

  const settlements: Settlement[] = []

  for (const debtor of debtors) {
    let amountNeeded = Math.abs(debtor.balance)

    for (const creditor of creditors) {
      if (creditor.balance <= 0.01) continue

      const amountToTransfer = Math.min(amountNeeded, creditor.balance)
      const rounded = Math.round(amountToTransfer * 100) / 100
      if (rounded <= 0.01) continue

      settlements.push({
        from: debtor.name,
        to: creditor.name,
        amount: rounded,
      })

      debtor.balance += rounded
      creditor.balance -= rounded
      amountNeeded -= rounded

      if (amountNeeded < 0.01) break
    }
  }

  return settlements
}
