import Layout from '@/components/layouts/MainLayout'
import { useAuth } from '@/hooks/useAuth'
import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth')({
  component: () =>{
    const auth = useAuth()
    return <Layout isAuth={auth.isAuthenticated}><Outlet/></Layout>}
})