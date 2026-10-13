import { cn, getInitials } from '@/lib/utils';
import Image from 'next/image';

interface AvatarProps {
  src?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl',
};

export function Avatar({ src, firstName, lastName, size = 'md', className }: AvatarProps) {
  const initials = getInitials(firstName, lastName);

  if (src) {
    return (
      <Image
        src={src}
        alt={`${firstName ?? ''} ${lastName ?? ''}`}
        width={size === 'xl' ? 96 : size === 'lg' ? 64 : size === 'md' ? 40 : 32}
        height={size === 'xl' ? 96 : size === 'lg' ? 64 : size === 'md' ? 40 : 32}
        className={cn('rounded-full object-cover', sizeMap[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-blue-600 font-semibold text-white',
        sizeMap[size],
        className
      )}
    >
      {initials}
    </div>
  );
}
