
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadCreated: () => void;
}

interface CreateLeadForm {
  nome_fantasia: string;
  cnpj: string;
  telefone?: string;
  endereco?: string;
}

const CreateLeadModal: React.FC<CreateLeadModalProps> = ({
  isOpen,
  onClose,
  onLeadCreated,
}) => {
  const { toast } = useToast();
  const form = useForm<CreateLeadForm>({
    defaultValues: {
      nome_fantasia: '',
      cnpj: '',
      telefone: '',
      endereco: '',
    },
  });

  const onSubmit = async (data: CreateLeadForm) => {
    try {
      const { error } = await supabase
        .from('leads')
        .insert({
          nome_fantasia: data.nome_fantasia,
          cnpj: data.cnpj,
          telefone: data.telefone || null,
          endereco: data.endereco || null,
          status: 'novo',
          data_criacao: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Lead cadastrado com sucesso!',
      });

      form.reset();
      onLeadCreated();
      onClose();
    } catch (error) {
      console.error('Erro ao cadastrar lead:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao cadastrar lead. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Lead</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome_fantasia"
              rules={{ required: 'Nome Fantasia é obrigatório' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Fantasia *</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o nome fantasia" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cnpj"
              rules={{ required: 'CNPJ é obrigatório' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CNPJ *</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o CNPJ" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telefone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o telefone (opcional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endereco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Digite o endereço (opcional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                Cadastrar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateLeadModal;
