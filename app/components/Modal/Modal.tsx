'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

import { XIcon } from '@/components/Icon';

import { ModalProps } from './+types';
import './modal.css';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  size = 'medium',
  className = '',
  showCloseButton = true,
  preventScroll = true,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Store previous focus
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [isOpen]);

  // Handle escape key
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        onClose();
      }
    },
    [closeOnEscape, onClose],
  );

  // Handle modal open/close effects
  useEffect(() => {
    if (!isOpen) return;

    // Prevent scroll
    if (preventScroll) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    // Focus modal
    const focusTimeout = setTimeout(() => {
      modalRef.current?.focus();
    }, 0);

    // Add escape listener
    document.addEventListener('keydown', handleEscape);

    return () => {
      clearTimeout(focusTimeout);

      if (preventScroll) {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }

      document.removeEventListener('keydown', handleEscape);

      // Restore focus
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, handleEscape, preventScroll]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (closeOnBackdropClick && e.target === e.currentTarget) {
        onClose();
      }
    },
    [closeOnBackdropClick, onClose],
  );

  // Focus trap implementation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab' || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])',
    );

    const focusableArray = Array.from(focusableElements);

    if (focusableArray.length === 0) return;

    const firstElement = focusableArray[0];
    const lastElement = focusableArray[focusableArray.length - 1];

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }, []);

  // Don't render if not open
  if (!isOpen) return null;

  const modalContent = (
    <div
      className={`modal-backdrop ${isOpen ? 'modal-backdrop--active' : ''}`}
      onClick={handleBackdropClick}
      role='presentation'
    >
      <div
        ref={modalRef}
        className={`modal-content modal-content--${size} ${className}`}
        role='dialog'
        aria-modal='true'
        aria-labelledby={title ? 'modal-title' : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        {(title || showCloseButton) && (
          <div className='modal-header'>
            {title && <span id='modal-title'>{title}</span>}
            {showCloseButton && (
              <button
                type='button'
                onClick={onClose}
                aria-label='Close modal'
                className='btn btn-transparent btn-icon'
              >
                <XIcon size={22} />
              </button>
            )}
          </div>
        )}
        <div className='modal-body'>{children}</div>
      </div>
    </div>
  );

  // Portal to body (Next.js App Router compatible)
  return createPortal(modalContent, document.body);
}
