import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';

const mockTransactions = [
  {
    id: 1,
    date: '2024-01-15',
    description: 'Office Supplies Purchase',
    reference: 'TXN001',
    amount: 500,
    type: 'Expense',
    account: 'Office Expenses',
  },
  {
    id: 2,
    date: '2024-01-16',
    description: 'Sales Revenue',
    reference: 'TXN002',
    amount: 2500,
    type: 'Revenue',
    account: 'Sales Revenue',
  },
  {
    id: 3,
    date: '2024-01-17',
    description: 'Rent Payment',
    reference: 'TXN003',
    amount: 1200,
    type: 'Expense',
    account: 'Rent Expense',
  },
  {
    id: 4,
    date: '2024-01-18',
    description: 'Customer Payment',
    reference: 'TXN004',
    amount: 3000,
    type: 'Asset',
    account: 'Cash',
  },
];

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState(mockTransactions);
  const [open, setOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    date: '',
    description: '',
    reference: '',
    amount: '',
    type: '',
    account: '',
  });

  const handleClose = () => {
    setOpen(false);
    setNewTransaction({
      date: '',
      description: '',
      reference: '',
      amount: '',
      type: '',
      account: '',
    });
  };

  const handleSave = () => {
    if (newTransaction.date && newTransaction.description && newTransaction.amount) {
      const transaction = {
        id: transactions.length + 1,
        ...newTransaction,
        amount: parseFloat(newTransaction.amount),
      };
      setTransactions([...transactions, transaction]);
      handleClose();
    }
  };

  const getTypeVariant = (type) => {
    switch (type) {
      case 'Revenue': return 'default';
      case 'Expense': return 'destructive';
      case 'Asset': return 'secondary';
      case 'Liability': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
          <p className="text-muted-foreground">
            Track and manage all your financial transactions
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Transaction</DialogTitle>
              <DialogDescription>
                Create a new transaction record for your accounting system.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newTransaction.date}
                    onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reference">Reference</Label>
                  <Input
                    id="reference"
                    placeholder="TXN001"
                    value={newTransaction.reference}
                    onChange={(e) => setNewTransaction({ ...newTransaction, reference: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Enter transaction description"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="account">Account</Label>
                  <Input
                    id="account"
                    placeholder="Account name"
                    value={newTransaction.account}
                    onChange={(e) => setNewTransaction({ ...newTransaction, account: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <select
                    id="type"
                    value={newTransaction.type}
                    onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select Type</option>
                    <option value="Asset">Asset</option>
                    <option value="Liability">Liability</option>
                    <option value="Revenue">Revenue</option>
                    <option value="Expense">Expense</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Transaction</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Complete record of all financial transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">{transaction.date}</TableCell>
                  <TableCell>{transaction.reference}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>{transaction.account}</TableCell>
                  <TableCell>
                    <Badge variant={getTypeVariant(transaction.type)}>
                      {transaction.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    ${transaction.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionsPage;