import { 
  Database,
  Home,
  MessageSquare,
  Settings,
} from "lucide-react"; 
import { Link, useNavigate } from "react-router-dom";
import DataLensLogo from "./DataLensLogo";

function AppSidebar({ activeTab = "overview", onTabChange }) {
  const navigate = useNavigate();

  const handleTabClick = (tabKey) => {
    if (onTabChange) {
      onTabChange(tabKey);
    } else {
      navigate(`/app?tab=${tabKey}`);
    }
  };

  const navItems = [
    { key: "overview", label: "Overview", icon: Home },
    { key: "datasets", label: "Datasets", icon: Database },
    { key: "conversations", label: "Conversations", icon: MessageSquare },
  ];

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      {/* Brand */} 
      <div className="flex h-16 items-center border-b border-slate-200 px-5">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-2xs">
            <DataLensLogo size={27} className="text-white"/>
          </div> 

          <span className="text-base font-bold tracking-tight text-slate-900">
            DataLens <span className="text-blue-600">AI</span>
          </span>
        </Link>
      </div> 

      {/* Navigation */} 
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => handleTabClick(item.key)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition cursor-pointer ${
                isActive
                  ? "bg-blue-50 text-blue-600 font-semibold shadow-2xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon size={17} className={isActive ? "text-blue-600" : "text-slate-400"} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav> 

      {/* Bottom Settings */} 
      <div className="border-t border-slate-200 p-4">
        <button
          onClick={() => handleTabClick("settings")}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition cursor-pointer ${
            activeTab === "settings"
              ? "bg-blue-50 text-blue-600 font-semibold shadow-2xs"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <Settings size={17} className={activeTab === "settings" ? "text-blue-600" : "text-slate-400"} />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
} 

export default AppSidebar;