
import { useMutation } from "@tanstack/react-query";

interface WebhookData {
  nomeCliente: string;
  telefone: string;
  dataPedido: string;
  descricaoPedido: string;
  valorTotal: number;
  valorEntrega: number;
  valorTotalComEntrega: number;
  statusPedido: string;
  observacoes?: string;
  numeroPedido: string;
  formaPagamento: string;
  enderecoEntrega?: string;
  precisaTroco?: boolean;
  valorTroco?: number;
}

export const useWebhook = () => {
  const sendWebhookMutation = useMutation({
    mutationFn: async (data: WebhookData) => {
      const webhookUrl = "https://hookworkflowrabbit.cleoia.com.br/webhook/c09a4fc9-e4a6-42dc-a3ec-4dcefe304e19";
      
      console.log("Enviando webhook com dados:", data);
      
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Erro no webhook: ${response.status}`);
      }

      return response;
    },
    onSuccess: () => {
      console.log("Webhook enviado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao enviar webhook:", error);
    },
  });

  return { sendWebhook: sendWebhookMutation.mutate };
};
