export default function EmptyState({message}:{message:string}){
    return <div className="flex items-center justify-center h-full w-full">
        <p className="text-lg">{message}</p>
    </div>
}
