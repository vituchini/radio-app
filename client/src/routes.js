import React from "react"
import {Switch, Route, Redirect} from 'react-router-dom'
import {AuthPage} from "./components/AuthPage";
import {AdminView} from "./components/AdminView";

export const useRoutes = (isAuthenticated) => {
    if (isAuthenticated) {
        return (
            <Switch>
                <Route path='/radio' exact>
                    <AdminView/>
                </Route>
                <Redirect to='/radio'/>
            </Switch>
        )
    }
    return (
        <Switch>
            <Route path='/' exact>
                <AuthPage/>
            </Route>
            <Redirect to={'/'}/>
        </Switch>
    )
}
