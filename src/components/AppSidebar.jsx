import { 
    BarChart3,
    Database,
    Home,
    MessageSquare,
    Settings,
} from "lucide-react"; 

function AppSidebar() {
    return (
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
            {/* Brand */} 
            <div className="flex h-16 items-center border-b border-slate-200 px-5">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                        <BarChart3 size={17} className="text-white"/>
                    </div> 

                    <span className="text-base font-bold tracking-tight text-slate-900">
                        DataLens <span className="text-blue-600">AI</span>
                    </span>
                </div>
            </div> 

            {/* Navigation */} 
            <nav className="flex-1 space-y-1 p-4">
                <a
                href="/app"
                className="flex items-center gap-3 rounded-lg bg-blue-50 px-3 py-2.5 text-sm font-medium text-blue-600"
                >
                    <Home size={17}/> 
                    Overview 
                </a> 

                <a
                href="#"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                >
                    <Database size={17}/>
                    Datasets 
                </a> 

                <a
                href="#"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                >
                    <MessageSquare size={17}/> 
                    Conversations 
                </a>
            </nav> 

            {/* Bottom */} 
            <div className="border-t border-slate-200 p-4">
                <a
                href="#"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                >
                    <Settings size={17}/> 
                    Settings 
                </a>
            </div>
        </aside>
    )
} 

export default AppSidebar;