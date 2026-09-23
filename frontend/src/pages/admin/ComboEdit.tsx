import { useParams } from "react-router-dom";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { ComboForm } from "../../components/admin/ComboForm";

export function ComboEdit() {
  const { productId } = useParams<{ productId: string }>();
  return (
    <AdminLayout>
      <ComboForm productId={productId} />
    </AdminLayout>
  );
}
