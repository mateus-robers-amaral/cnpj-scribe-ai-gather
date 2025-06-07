
import LeadForm from '@/components/LeadForm';

const Index = () => {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Sistema de Leads</h1>
          <p className="text-xl text-muted-foreground">
            Cadastre novos leads empresariais
          </p>
        </div>
        <LeadForm />
      </div>
    </div>
  );
};

export default Index;
