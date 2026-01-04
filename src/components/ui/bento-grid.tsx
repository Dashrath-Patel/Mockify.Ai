import { cn } from "@/lib/utils";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "mx-auto grid max-w-7xl grid-cols-1 gap-3 sm:gap-4 md:auto-rows-[18rem] md:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "group/bento row-span-1 flex flex-col justify-between space-y-2 sm:space-y-4 rounded-xl sm:rounded-2xl border-2 sm:border-[3px] border-black bg-white p-3 sm:p-6 transition-all duration-200 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1",
        className,
      )}
    >
      <div className="max-h-[120px] sm:max-h-none overflow-hidden">
        {header}
      </div>
      <div className="transition duration-200 group-hover/bento:translate-x-2">
        {icon}
        <div className="mt-1 sm:mt-2 mb-1 sm:mb-2 font-sans font-bold text-black text-base sm:text-xl">
          {title}
        </div>
        <div className="font-sans text-xs sm:text-sm font-medium text-black line-clamp-2 sm:line-clamp-none">
          {description}
        </div>
      </div>
    </div>
  );
};
