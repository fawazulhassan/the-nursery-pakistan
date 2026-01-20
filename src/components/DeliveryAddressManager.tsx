import { useState, useEffect } from 'react';
import { Plus, MapPin, Edit2, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DeliveryAddress {
  id: string;
  full_name: string;
  phone_number: string;
  address_line: string;
  city: string;
  notes: string | null;
  is_default: boolean;
}

interface AddressFormData {
  full_name: string;
  phone_number: string;
  address_line: string;
  city: string;
  notes: string;
  is_default: boolean;
}

const initialFormData: AddressFormData = {
  full_name: '',
  phone_number: '',
  address_line: '',
  city: '',
  notes: '',
  is_default: false,
};

const DeliveryAddressManager = () => {
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<DeliveryAddress | null>(null);
  const [editingAddress, setEditingAddress] = useState<DeliveryAddress | null>(null);
  const [formData, setFormData] = useState<AddressFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof AddressFormData, string>>>({});

  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  const fetchAddresses = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('delivery_addresses')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof AddressFormData, string>> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = 'Full name must be at least 2 characters';
    }

    if (!formData.phone_number.trim()) {
      newErrors.phone_number = 'Phone number is required';
    } else if (!/^[\d\s+\-()]+$/.test(formData.phone_number)) {
      newErrors.phone_number = 'Please enter a valid phone number';
    }

    if (!formData.address_line.trim()) {
      newErrors.address_line = 'Address is required';
    } else if (formData.address_line.trim().length < 10) {
      newErrors.address_line = 'Please enter a complete address';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!user) return;

    setIsSaving(true);
    try {
      // If setting as default, unset other defaults first
      if (formData.is_default) {
        await supabase
          .from('delivery_addresses')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      if (editingAddress) {
        // Update existing address
        const { error } = await supabase
          .from('delivery_addresses')
          .update({
            full_name: formData.full_name.trim(),
            phone_number: formData.phone_number.trim(),
            address_line: formData.address_line.trim(),
            city: formData.city.trim(),
            notes: formData.notes.trim() || null,
            is_default: formData.is_default,
          })
          .eq('id', editingAddress.id);

        if (error) throw error;

        toast({
          title: 'Address Updated',
          description: 'Your delivery address has been updated.',
        });
      } else {
        // Create new address
        const { error } = await supabase
          .from('delivery_addresses')
          .insert({
            user_id: user.id,
            full_name: formData.full_name.trim(),
            phone_number: formData.phone_number.trim(),
            address_line: formData.address_line.trim(),
            city: formData.city.trim(),
            notes: formData.notes.trim() || null,
            is_default: formData.is_default || addresses.length === 0, // First address is default
          });

        if (error) throw error;

        toast({
          title: 'Address Added',
          description: 'Your delivery address has been saved.',
        });
      }

      setIsDialogOpen(false);
      setEditingAddress(null);
      setFormData(initialFormData);
      fetchAddresses();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (address: DeliveryAddress) => {
    setEditingAddress(address);
    setFormData({
      full_name: address.full_name,
      phone_number: address.phone_number,
      address_line: address.address_line,
      city: address.city,
      notes: address.notes || '',
      is_default: address.is_default,
    });
    setErrors({});
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!addressToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('delivery_addresses')
        .delete()
        .eq('id', addressToDelete.id);

      if (error) throw error;

      toast({
        title: 'Address Deleted',
        description: 'Your delivery address has been removed.',
      });

      setIsDeleteDialogOpen(false);
      setAddressToDelete(null);
      fetchAddresses();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSetDefault = async (address: DeliveryAddress) => {
    if (!user || address.is_default) return;

    try {
      // Unset all defaults
      await supabase
        .from('delivery_addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);

      // Set new default
      const { error } = await supabase
        .from('delivery_addresses')
        .update({ is_default: true })
        .eq('id', address.id);

      if (error) throw error;

      toast({
        title: 'Default Address Updated',
        description: 'Your default delivery address has been changed.',
      });

      fetchAddresses();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const openNewAddressDialog = () => {
    setEditingAddress(null);
    setFormData(initialFormData);
    setErrors({});
    setIsDialogOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof AddressFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Delivery Addresses</h2>
          <p className="text-muted-foreground">Manage your saved delivery addresses</p>
        </div>
        <Button onClick={openNewAddressDialog} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No addresses saved</h3>
            <p className="text-muted-foreground mb-6">
              Add a delivery address to make checkout faster
            </p>
            <Button onClick={openNewAddressDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Address
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <Card key={address.id} className={address.is_default ? 'ring-2 ring-primary' : ''}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span className="font-semibold">{address.full_name}</span>
                  </div>
                  {address.is_default && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Default
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <p>{address.address_line}</p>
                  <p>{address.city}</p>
                  <p>{address.phone_number}</p>
                  {address.notes && (
                    <p className="italic">Note: {address.notes}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(address)}
                    className="flex items-center gap-1"
                  >
                    <Edit2 className="h-3 w-3" />
                    Edit
                  </Button>
                  {!address.is_default && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(address)}
                    >
                      Set as Default
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAddressToDelete(address);
                      setIsDeleteDialogOpen(true);
                    }}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Address Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? 'Edit Address' : 'Add New Address'}
            </DialogTitle>
            <DialogDescription>
              {editingAddress 
                ? 'Update your delivery address details.' 
                : 'Add a new delivery address for faster checkout.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Enter recipient's name"
                className={errors.full_name ? 'border-destructive' : ''}
              />
              {errors.full_name && (
                <p className="text-sm text-destructive mt-1">{errors.full_name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone_number">Phone Number *</Label>
              <Input
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="+92 300 1234567"
                className={errors.phone_number ? 'border-destructive' : ''}
              />
              {errors.phone_number && (
                <p className="text-sm text-destructive mt-1">{errors.phone_number}</p>
              )}
            </div>

            <div>
              <Label htmlFor="address_line">Address *</Label>
              <Textarea
                id="address_line"
                name="address_line"
                value={formData.address_line}
                onChange={handleChange}
                placeholder="House/Flat number, Street, Area"
                rows={2}
                className={errors.address_line ? 'border-destructive' : ''}
              />
              {errors.address_line && (
                <p className="text-sm text-destructive mt-1">{errors.address_line}</p>
              )}
            </div>

            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Karachi, Lahore, Islamabad, etc."
                className={errors.city ? 'border-destructive' : ''}
              />
              {errors.city && (
                <p className="text-sm text-destructive mt-1">{errors.city}</p>
              )}
            </div>

            <div>
              <Label htmlFor="notes">Delivery Notes (Optional)</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any special delivery instructions"
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <Label htmlFor="is_default" className="text-sm font-medium">
                  Set as default address
                </Label>
                <p className="text-xs text-muted-foreground">
                  Use this address by default at checkout
                </p>
              </div>
              <Switch
                id="is_default"
                checked={formData.is_default}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked }))}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : editingAddress ? 'Update Address' : 'Save Address'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Address</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this address? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DeliveryAddressManager;
