export default function DashboardCard({
  title,
  subtitle,
  badge,
  icon: Icon,
  onClick,
  className = "",
  badgeColor = "bg-orange-100 text-[#ff7448]"
}) {
  return (
    <button
      onClick={onClick}
      className={`
        ${className}
        w-full
        min-h-[94px]
        p-3
        bg-white
        rounded-[20px]
        shadow-[0_4px_20px_rgba(0,0,0,0.03)]
        hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)]
        border border-gray-100/60
        transition-all
        duration-300
        flex
        flex-col
        items-center
        justify-center
        relative
        overflow-hidden
        active:scale-95
        cursor-pointer
      `}
    >
      {badge && (
        <span className={`absolute top-2 right-2 text-[9.5px] font-black px-1.5 py-0.5 rounded-full ${badgeColor}`}>
          {badge}
        </span>
      )}

      {/* Icon Circle */}
      <div className="w-[42px] h-[42px] rounded-full bg-[#ff7448]/10 flex items-center justify-center">
        <Icon
          size={20}
          strokeWidth={2.2}
          className="text-[#ff7448]"
        />
      </div>

      {/* Title */}
      <h2 className="mt-1.5 text-[13.5px] font-bold text-[#2F2F2F] text-center leading-tight px-1">
        {title}
      </h2>

      {subtitle && (
        <p className="text-[10.5px] text-gray-400 font-medium leading-none mt-0.5">
          {subtitle}
        </p>
      )}
    </button>
  );
}