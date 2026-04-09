export default function Avatar({name, size = "md"}:{name:string; size?:"sm"|"md"|"lg"}){
    const initials = name.split(" ").map((n)=>n[0]).join("").toUpperCase().slice(0,2);
    const sizeClasses = {
        sm: "w-8 h-8 text-xs",
        md: "w-10 h-10 text-sm",
        lg: "w-14 h-14 text-lg"
    };
    return <div className={`${sizeClasses[size]} rounded-full border flex items-center justify-center font-semibold shrink-0`}>{initials}</div>
}
