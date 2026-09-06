import { Bell, Plus } from "lucide-react"; 
import AppSidebar from "./AppSidebar"; 

function AppShell() {
    return (
        <div className="flex min-h-screen bg-slate-50">
            <AppSidebar /> 

            <div className="flex min-w-0 flex-1 flex-col">
                {/* Top Bar */} 
                <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
                    <div>
                        <p className="text-xs font-medium text-slate-400">
                            Workspace 
                        </p> 

                        <h1 className="text-sm font-semibold text-slate-900">
                            Data Analysis 
                        </h1>
                    </div> 

                    <div className="flex items-center gap-3">
                        <button
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                        aria-label="Notifications"
                        >
                            <Bell size={17}/>
                        </button> 

                        <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700" >
                            <Plus size={16}/>
                            New dataset 
                        </button>
                    </div>
                </header> 

                {/* Main Workspace */} 
                <main className="flex-1 p-6 lg:p-8">
                    <div className="mx-auto max-w-6xl">
                        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                            <p className="text-sm font-medium text-blue-600">
                                Welcome to DataLens AI 
                            </p> 

                            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                                Start exploring your data. 
                            </h2> 

                            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
                                Upload a dataset and start asking questions in plain English. 
                            </p>
                        </div>
                    </div>
                </main>
            </div>
        </div> 
    )
} 

export default AppShell;