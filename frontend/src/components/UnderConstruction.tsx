import { HardHat } from "lucide-react";

export default function UnderConstruction({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mb-6">
        <HardHat className="w-10 h-10 text-brand-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-500 max-w-md mx-auto">
        This page is currently under development. We are working hard to bring you this feature soon!
      </p>
    </div>
  );
}
