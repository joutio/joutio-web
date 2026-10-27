import {BrowserRouter} from "react-router-dom"
import {QueryClientProvider} from "@tanstack/react-query"
import {useTranslation} from "react-i18next"
import {queryClient} from "@/lib/query-client"
import {SessionBootstrap} from "@/features/auth"
import {useSession} from "@/features/auth"
import {LanguageSync, ThemeProvider} from "@/features/shell"
import {useTheme} from "@/features/shell"
import {Toaster} from "@/components/ui/sonner"
import {ErrorBoundary} from "@/shared/components/ErrorBoundary"
import {ErrorToasterBridge} from "@/shared/components/ErrorToasterBridge"
import {PresenceConnection} from "@/shared/components/PresenceConnection"
import {AppRoutes} from "@/routes"

function AppToaster() {
    const {resolvedTheme} = useTheme()
    return <Toaster theme={resolvedTheme}/>
}

function AppContent() {
    const {ready} = useSession()
    const {t} = useTranslation()

    if (!ready) {
        return (
            <div className="grid min-h-svh place-items-center text-sm text-muted-foreground">
                {t("common.app.loading")}
            </div>
        )
    }

    return (
        <>
            <LanguageSync/>
            <ErrorBoundary>
                <AppRoutes/>
            </ErrorBoundary>
            <AppToaster/>
            <ErrorToasterBridge/>
            <PresenceConnection/>
        </>
    )
}

export function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <ThemeProvider>
                    <SessionBootstrap>
                        <AppContent/>
                    </SessionBootstrap>
                </ThemeProvider>
            </BrowserRouter>
        </QueryClientProvider>
    )
}

export default App
