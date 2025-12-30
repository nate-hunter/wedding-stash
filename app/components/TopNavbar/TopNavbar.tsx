'use client';

/*
Currently this component is configured for testing

TODO: Update after basic app features implemented.
TODO: Decide on what to call pages/navlinks.
*/

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from '@supabase/supabase-js';

import { createClient } from '@/utils/supabase/client';

import './top-navbar.css';
import { UploadIcon } from '@/components/Icon';

import Modal, { useModal } from '@/components/Modal';
// import { Modal } from '@/components/Modal/(examples)/ModalPortal';
import UploadMediaItems from '@/components/UploadMediaItems';

type NavLink = {
  key: string;
  label: string;
  path: string;
};

const NAV_LINKS: Array<NavLink> = [
  {
    key: 'nav-home',
    label: 'Home',
    path: '/',
  },
  // {
  //   key: 'nav-galleries',
  //   label: 'Galleries',
  //   path: '/galleries',
  // },
  {
    key: 'nav-user-media-items',
    label: 'My Collections',
    path: '/collections',
  },
];

export default function TopNavbar() {
  const supabase = createClient();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  // TEST MODAL:
  const { isOpen, open, close } = useModal();
  //

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  return (
    <>
      {/********* MODAL TAKE 3 *********/}
      <Modal title='Upload Files' isOpen={isOpen} onClose={close}>
        <UploadMediaItems />
      </Modal>

      <nav className='nav-bar px-5 py-4 md:py-7 md:px-6 md:h-9'>
        <div className='flex flex-col gap-4 align-items-center md:flex-row md:gap-7'>
          {/* APP NAME / BRAND / LOGO*/}
          <span className='nav-brand'>
            Lisa & Nate
            {/* Stash */}
          </span>

          {/* NAV LINKS */}
          {NAV_LINKS.map(({ key, label, path }) => {
            const isActive = pathname === path || (pathname.startsWith(path) && path !== '/');
            return (
              <Link
                key={key}
                href={path}
                className={`nav-link ${isActive ? 'nav-link-active' : ''}`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {user ? (
          <div className='flex flex-col-reverse gap-4 align-items-center md:flex-row md:gap-7'>
            {/* Replace Link with a button to open a modal for uploading media items? */}
            <button onClick={open} className='btn btn-cta-outlined btn-sm'>
              <UploadIcon size={16} />
              Upload Files
            </button>

            {/* AUTHENTICATION */}
            <div className='flex align-items-center gap-6'>
              <span className='nav-user text-xs md:text-base'>{user.email}</span>
              <form action='/auth/signout' method='post' className='nav-form'>
                <button type='submit' className='btn btn-inverted-outlined btn-sm w-max'>
                  <span>Sign Out</span>
                </button>
              </form>
            </div>
          </div>
        ) : (
          <Link href='/login' className='nav-link'>
            Sign In
          </Link>
        )}
      </nav>

      {/********* MODAL TAKE 2 *********/}
      {/* <Modal isOpen={isOpen} onClose={close}>
        <UploadMediaItems />
      </Modal> */}

      {/********* MODAL TAKE 1 *********/}
      {/* <Modal isOpen={isOpen} onClose={close}>
        <p>Are you sure you want to proceed with this action?</p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button onClick={close}>Cancel</button>
          <button
            onClick={() => {
              // Handle action
              close();
            }}
          >
            Confirm
          </button>
        </div>
      </Modal> */}
    </>
  );
}
