
import { useOrdersData } from "@/hooks/useOrdersData";
import { useOrderStatusMutation } from "@/hooks/useOrderStatusMutation";
import { useBulkFinalizeMutation } from "@/hooks/useBulkFinalizeMutation";

export function useMonitoringData() {
  const {
    orders,
    orderItems,
    getOrderItems,
    getOrderDescription
  } = useOrdersData();

  const { updateOrderStatusMutation } = useOrderStatusMutation();
  const { bulkFinalizeMutation } = useBulkFinalizeMutation();

  return {
    orders,
    orderItems,
    updateOrderStatusMutation,
    bulkFinalizeMutation,
    getOrderItems,
    getOrderDescription
  };
}
