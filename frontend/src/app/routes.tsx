import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { BibleReader } from "./pages/BibleReader";
import { Collections } from "./pages/Collections";
import { CollectionDetail } from "./pages/CollectionDetail";
import { TypingPractice } from "./pages/TypingPractice";
import { Copyright } from "./pages/Copyright";
import { NotFound } from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "login", Component: Login },
      { path: "signup", Component: Signup },
      { path: "read", Component: BibleReader },
      { path: "collections", Component: Collections },
      { path: "collections/:collectionId", Component: CollectionDetail },
      { path: "collections/:collectionId/practice", Component: TypingPractice },
      { path: "copyright", Component: Copyright },
      { path: "*", Component: NotFound },
    ],
  },
]);