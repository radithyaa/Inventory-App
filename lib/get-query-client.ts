import { QueryClient } from "@tanstack/react-query";
import { cache } from "react";

// The cache() function is a React experimental feature that allows you to cache the result of a function call.
// In this case, we're caching the QueryClient instance so that it's only created once per request.
const getQueryClient = cache(() => new QueryClient());
export default getQueryClient;
