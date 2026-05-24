import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Server, Smartphone } from 'lucide-react';
import { ConflictData } from '@/utils/offlineQueue';

interface ConflictResolutionDialogProps {
  conflicts: ConflictData[];
  onResolve: (conflictId: string, resolution: 'keep-local' | 'keep-server') => void;
  onClose: () => void;
}

export function ConflictResolutionDialog({ 
  conflicts, 
  onResolve, 
  onClose 
}: ConflictResolutionDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentConflict = conflicts[currentIndex];

  if (!currentConflict) {
    return null;
  }

  const handleResolve = (resolution: 'keep-local' | 'keep-server') => {
    onResolve(currentConflict.id, resolution);
    
    // Move to next conflict or close if this was the last one
    if (currentIndex < conflicts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  const formatData = (data: any): string => {
    if (!data) return 'Nenhum dado';
    
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  const getConflictDescription = (conflict: ConflictData): string => {
    if (conflict.type === 'delete') {
      return `Você tentou excluir algo que foi alterado em outro dispositivo. Escolha como resolver.`;
    }
    return `Você fez alterações enquanto estava offline. Escolha qual versão manter.`;
  };

  const renderDataComparison = (localData: any, serverData: any) => {
    if (!localData || !serverData) {
      return (
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Sua versão:</h4>
            <pre className="text-sm">{formatData(localData)}</pre>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Versão atual:</h4>
            <pre className="text-sm">{formatData(serverData)}</pre>
          </div>
        </div>
      );
    }

    // Find differing fields
    const allKeys = new Set([
      ...Object.keys(localData),
      ...Object.keys(serverData),
    ]);

    const differences: { key: string; local: any; server: any }[] = [];
    const same: { key: string; value: any }[] = [];

    allKeys.forEach((key) => {
      if (JSON.stringify(localData[key]) !== JSON.stringify(serverData[key])) {
        differences.push({
          key,
          local: localData[key],
          server: serverData[key],
        });
      } else {
        same.push({
          key,
          value: localData[key],
        });
      }
    });

    return (
      <div className="space-y-4">
        {differences.length > 0 && (
          <div>
            <h4 className="font-medium mb-2 text-warning">O que mudou:</h4>
            <div className="space-y-2">
              {differences.map((diff) => (
                <div key={diff.key} className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                    <p className="text-xs font-medium mb-1 flex items-center gap-1">
                      <Smartphone className="h-3 w-3" />
                      {diff.key} (Seus dados)
                    </p>
                    <pre className="text-sm">{formatData(diff.local)}</pre>
                  </div>
                  <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-xs font-medium mb-1 flex items-center gap-1">
                      <Server className="h-3 w-3" />
                      {diff.key} (Versão atual)
                    </p>
                    <pre className="text-sm">{formatData(diff.server)}</pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {same.length > 0 && (
          <div>
            <h4 className="font-medium mb-2 text-muted-foreground">Sem alterações:</h4>
            <div className="p-3 bg-muted rounded-lg space-y-1">
              {same.map((item) => (
                <div key={item.key} className="text-sm">
                  <span className="font-medium">{item.key}:</span>{' '}
                  {formatData(item.value)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <DialogTitle>Sincronização Necessária</DialogTitle>
          </div>
          <DialogDescription>
            {getConflictDescription(currentConflict)}
          </DialogDescription>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">
              Alteração {currentIndex + 1} de {conflicts.length}
            </Badge>
            <Badge variant="secondary">
              {currentConflict.type === 'update' ? 'Edição' : 'Exclusão'}
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh]">
          <Tabs defaultValue="comparison" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="comparison">Comparação</TabsTrigger>
              <TabsTrigger value="raw">Dados Completos</TabsTrigger>
            </TabsList>

            <TabsContent value="comparison" className="space-y-4">
              {renderDataComparison(currentConflict.localData, currentConflict.serverData)}
            </TabsContent>

            <TabsContent value="raw" className="space-y-4">
              <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Seus dados (salvos offline):
                </h4>
                <pre className="text-xs overflow-x-auto">
                  {formatData(currentConflict.localData)}
                </pre>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  Versão mais recente:
                </h4>
                <pre className="text-xs overflow-x-auto">
                  {formatData(currentConflict.serverData)}
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => handleResolve('keep-server')}
            className="w-full sm:w-auto"
          >
            <Server className="h-4 w-4 mr-2" />
            Usar versão mais recente
          </Button>
          <Button
            onClick={() => handleResolve('keep-local')}
            className="w-full sm:w-auto bg-primary"
          >
            <Smartphone className="h-4 w-4 mr-2" />
            Manter minhas mudanças
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
