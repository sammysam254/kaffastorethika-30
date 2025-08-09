import { memo } from 'react';

interface AdminLoadingFallbackProps {
  message?: string;
}

const AdminLoadingFallback = memo(({ message = "Loading..." }: AdminLoadingFallbackProps) => {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
});

AdminLoadingFallback.displayName = 'AdminLoadingFallback';

export default AdminLoadingFallback;