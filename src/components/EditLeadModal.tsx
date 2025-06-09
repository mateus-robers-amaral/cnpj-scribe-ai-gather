
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Lead {
  id: string;
  nome_fantasia: string;
  cnpj: string;
  telefone: string | null;
  endereco: string | null;
  status: string | null;
}

interface EditLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  onLeadUpdated: () => void;
}

const EditLeadModal: React.FC<EditLeadModalProps> = ({ 
  isOpen, 
  onClose, 
  lead, 
  onLeadUpdated 
}) => {
  const [formData, setFormData] = useState({
    nome_fantasia: '',
    cnpj: '',
    telefone: '',
    endereco: '',
    status: 'novo'
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (lead) {
      setFormData({
        nome_fantasia: lead.nome_fantasia || '',
        cnpj: lead.cnpj || '',
        telefone: lead.telefone || '',
        endereco: lead.endereco || '',
        status: lead.status || 'novo'
      });
    }
  }, [lead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update(formData)
        .eq('id', lead.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Lead atualizado com sucesso!',
      });

      onLeadUpdated();
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar lead.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Lead</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
            <Input
              id="nome_fantasia"
              value={formData.nome_fantasia}
              onChange={(e) => setFormData({ ...formData, nome_fantasia: e.target.value })}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              value={formData.cnpj}
              onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
            />
          </div>
          
          <div>
            <Label htmlFor="endereco">Endereço</Label>
            <Input
              id="endereco"
              value={formData.endereco}
              onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
            />
          </div>
          
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="novo">Novo</SelectItem>
                <SelectItem value="em_validacao">Em Validação</SelectItem>
                <SelectItem value="finalizado">Finalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditLeadModal;
