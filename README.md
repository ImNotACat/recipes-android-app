# RecipesApp

A React Native mobile app built with Expo, featuring Google OAuth authentication via Supabase.

## Tech Stack

- **Framework**: React Native with Expo
- **Routing**: Expo Router (file-based routing)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Authentication**: Supabase Auth with Google OAuth
- **State Management**: TanStack Query (React Query)
- **Language**: TypeScript

## Project Structure

```
RecipesApp/
├── app/                      # Expo Router pages
│   ├── _layout.tsx           # Root layout (providers)
│   ├── index.tsx             # Entry redirect based on auth
│   ├── (auth)/               # Unauthenticated routes
│   │   ├── _layout.tsx       # Auth layout (redirects if logged in)
│   │   └── sign-in.tsx       # Sign in screen
│   └── (app)/                # Protected routes (requires auth)
│       ├── _layout.tsx       # App layout (redirects if not logged in)
│       └── index.tsx         # Home screen
├── src/
│   ├── components/           # Reusable UI components
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Library configurations
│   └── providers/            # React context providers
└── ...config files
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- Expo Go app on your phone (for testing)
- A Supabase project with Google OAuth configured

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and add your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase project URL and Publishable API key (found in Settings > API > Publishable API keys):

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_API_KEY=your-publishable-api-key-here
```

### 3. Configure Supabase Google OAuth

In your Supabase dashboard:

1. Go to **Authentication** > **Providers** > **Google**
2. Enable Google provider
3. Add your Google OAuth credentials (Client ID and Secret)
4. Add the redirect URL: `recipesapp://auth/callback`

### 4. Run the App

```bash
# Start the development server
npm start

# Or run on specific platform
npm run android
npm run ios
npm run web
```

## Key Concepts

### Authentication Flow

1. User taps "Continue with Google" on sign-in screen
2. App opens browser for Google OAuth
3. After authentication, Supabase redirects back to app
4. App captures tokens and establishes session
5. User is redirected to home screen

### Route Groups

- `(auth)` - Routes only accessible when NOT signed in
- `(app)` - Routes only accessible when signed in

The layouts automatically handle redirects based on authentication state.

### NativeWind (Tailwind)

Use Tailwind classes directly in your components:

```tsx
<View className="flex-1 bg-white p-4">
  <Text className="text-lg font-bold text-gray-900">Hello!</Text>
</View>
```

### TanStack Query

Use for data fetching with automatic caching:

```tsx
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

function useRecipes() {
  return useQuery({
    queryKey: ['recipes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select('*');
      if (error) throw error;
      return data;
    },
  });
}
```

## Next Steps

Now that authentication is set up, you can:

1. **Create database tables** in Supabase for recipes
2. **Build recipe components** (cards, lists, detail views)
3. **Add recipe CRUD operations** using TanStack Query
4. **Implement search** functionality
5. **Add favorites** feature with user-specific data

## Troubleshooting

### OAuth not working on mobile?

- Make sure the app scheme `recipesapp` is configured in `app.json`
- Verify the redirect URL in Supabase matches: `recipesapp://auth/callback`

### Styles not applying?

- Clear Metro cache: `npx expo start --clear`
- Ensure `global.css` is imported in root layout

### Session not persisting?

- Check that SecureStore is working (only on native, not web)
- Verify Supabase credentials are correct
