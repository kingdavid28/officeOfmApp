import React, { useState } from 'react';
import { useApp, Receipt } from '../contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Plus, Upload, Trash2, Tag, DollarSign, Calendar as CalendarIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { ImageWithFallback } from './figma/ImageWithFallback';

const categories = [
  'Office Supplies',
  'Transportation',
  'Utilities',
  'Meals & Entertainment',
  'Equipment',
  'Services',
  'Other'
];

export function ReceiptManager() {
  const { receipts, addReceipt, deleteReceipt, user } = useApp();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: categories[0],
    date: new Date().toISOString().split('T')[0],
    tags: '',
    imageUrl: ''
  });

  const resetForm = () => {
    setFormData({
      title: '',
      amount: '',
      category: categories[0],
      date: new Date().toISOString().split('T')[0],
      tags: '',
      imageUrl: ''
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you would upload to a server/storage
      // For demo, we'll use a placeholder
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const tags = formData.tags.split(',').map(t => t.trim()).filter(t => t);
    
    addReceipt({
      title: formData.title,
      amount: parseFloat(formData.amount),
      category: formData.category,
      date: formData.date,
      tags,
      imageUrl: formData.imageUrl || 'https://images.unsplash.com/photo-1554224311-beee4ece8c35?w=400',
      uploadedBy: user?.name || 'Unknown'
    });
    
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this receipt?')) {
      deleteReceipt(id);
      if (selectedReceipt?.id === id) {
        setSelectedReceipt(null);
      }
    }
  };

  const filteredReceipts = filterCategory === 'all' 
    ? receipts 
    : receipts.filter(r => r.category === filterCategory);

  const totalAmount = filteredReceipts.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Receipt Manager</h2>
          <p className="text-muted-foreground">
            Upload and manage financial receipts
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Receipt
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload New Receipt</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="receipt-image">Receipt Image</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  {formData.imageUrl ? (
                    <div className="space-y-2">
                      <img 
                        src={formData.imageUrl} 
                        alt="Receipt preview" 
                        className="max-h-48 mx-auto rounded"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData({ ...formData, imageUrl: '' })}
                      >
                        Remove Image
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                      <div className="mt-2">
                        <label htmlFor="receipt-image" className="cursor-pointer">
                          <span className="text-primary hover:underline">
                            Upload a file
                          </span>
                          <input
                            id="receipt-image"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileUpload}
                          />
                        </label>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG up to 10MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title">Title/Description</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Office supplies purchase"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₱)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g., urgent, reimbursable"
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Upload Receipt
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <Label>Filter by Category:</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 text-lg font-semibold">
              <DollarSign className="h-5 w-5" />
              Total: ₱{totalAmount.toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Receipts Grid */}
      {filteredReceipts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No receipts found. Upload your first receipt to get started!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredReceipts.map((receipt) => (
            <Card 
              key={receipt.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedReceipt(receipt)}
            >
              <div className="aspect-video relative overflow-hidden rounded-t-lg bg-muted">
                <img
                  src={receipt.imageUrl}
                  alt={receipt.title}
                  className="object-cover w-full h-full"
                />
              </div>
              <CardHeader>
                <CardTitle className="text-base line-clamp-2">
                  {receipt.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      ₱{receipt.amount.toLocaleString()}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(receipt.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <Badge variant="secondary">{receipt.category}</Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarIcon className="h-3 w-3" />
                    {new Date(receipt.date).toLocaleDateString()}
                  </div>
                  {receipt.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {receipt.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          <Tag className="h-2 w-2 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Receipt Preview Dialog */}
      {selectedReceipt && (
        <Dialog open={!!selectedReceipt} onOpenChange={() => setSelectedReceipt(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedReceipt.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <img
                src={selectedReceipt.imageUrl}
                alt={selectedReceipt.title}
                className="w-full rounded-lg"
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Amount</Label>
                  <p className="text-2xl font-bold">
                    ₱{selectedReceipt.amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label>Date</Label>
                  <p>{new Date(selectedReceipt.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label>Category</Label>
                  <p>{selectedReceipt.category}</p>
                </div>
                <div>
                  <Label>Uploaded By</Label>
                  <p>{selectedReceipt.uploadedBy}</p>
                </div>
              </div>
              {selectedReceipt.tags.length > 0 && (
                <div>
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedReceipt.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
