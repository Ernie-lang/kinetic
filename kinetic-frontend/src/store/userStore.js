import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUserStore = create(
    persist(
        (set) => ({
            user: null,
            isConnected: false,

            setUser: (user) => set({ user, isConnected: !!user }),
            clearUser: () => set({ user: null, isConnected: false }),

            logout: () => {
                set({ user: null, isConnected: false });
                localStorage.removeItem('kinetic-user-storage');
            },
        }),
        {
            name: 'kinetic-user-storage',
        }
    )
);