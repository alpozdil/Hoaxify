import {createBrowserRouter, Navigate } from "react-router-dom";

import { Home } from "@/pages/Home";
import { SignUp } from "@/pages/SignUp";
import App from "@/App";
import { Activation } from "@/pages/Activation";
import { User } from "@/pages/User";
import { Login } from "@/pages/Login";
import { PasswordResetRequest } from "@/pages/PasswordReset/Request";
import { SetPassword } from "@/pages/PasswordReset/SetPassword";
import { CreatePost } from "@/pages/CreatePost";
import { FollowList } from "@/pages/User/components/FollowList";
import { Search } from "@/pages/Search";
import { Messages } from "@/pages/Messages";
import { WebSocketMessages } from "@/pages/Messages/WebSocketMessages";
import Notifications from "@/pages/Notifications";

export const router = createBrowserRouter([
    {
      path: "/",
      Component: App,
      children: [
        {
          path: "/",
          element: <Navigate to="/feed" replace />
        },
        {
          path: "/feed",
          Component: Home,
        },
        {
          path: "/search",
          Component: Search
        },
        {
          path: "/notifications",
          Component: Notifications
        },
        {
          path: "/messages",
          Component: WebSocketMessages
        },
        {
          path: "/messages/:conversationId",
          Component: WebSocketMessages
        },
        {
          path: "/messages-old",
          Component: Messages
        },
        {
          path: "/messages-old/:conversationId",
          Component: Messages
        },
        {
          path: "/create-post",
          Component: CreatePost
        },
        {
          path: "/signup",
          Component: SignUp
        },
        {
          path: "/activation/:token",
          Component: Activation
        },
        {
          path: "/user/:id",
          Component: User
        },
        {
          path: "/users/:id",
          Component: User
        },
        {
          path: "/users/:id/followers",
          element: <FollowList type="followers" />
        },
        {
          path: "/users/:id/following",
          element: <FollowList type="following" />
        },
        {
          path: '/login',
          Component: Login
        },
        {
          path: "/password-reset/request",
          Component: PasswordResetRequest
        },
        {
          path: "/password-reset/set",
          Component: SetPassword
        },
        {
          path: "*",
          element: <Navigate to="/feed" replace />
        }
      ]
    }
  ])