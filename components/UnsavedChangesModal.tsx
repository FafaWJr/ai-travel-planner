'use client';

import React from 'react';
import { AlertTriangle, Save, LogOut, X } from 'lucide-react';

interface UnsavedChangesModalProps {
  isOpen: boolean;
  isSaving: boolean;
  onSaveAndLeave: () => void;
  onLeaveWithoutSaving: () => void;
  onStay: () => void;
}

export default function UnsavedChangesModal({
  isOpen,
  isSaving,
  onSaveAndLeave,
  onLeaveWithoutSaving,
  onStay,
}: UnsavedChangesModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '440px',
          width: '100%',
          boxShadow: '0 24px 60px rgba(0, 68, 123, 0.2)',
          position: 'relative',
        }}
      >
        {/* Close X */}
        <button
          onClick={onStay}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#6C6D6F',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
          }}
        >
          <X size={20} />
        </button>

        {/* Icon */}
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 130, 16, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
          }}
        >
          <AlertTriangle size={26} color="#FF8210" />
        </div>

        {/* Heading */}
        <h2
          style={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 700,
            fontSize: '20px',
            color: '#00447B',
            margin: '0 0 10px 0',
          }}
        >
          You have unsaved changes
        </h2>

        {/* Body */}
        <p
          style={{
            fontFamily: 'Inter, Lato, sans-serif',
            fontSize: '14px',
            color: '#6C6D6F',
            lineHeight: '1.6',
            margin: '0 0 28px 0',
          }}
        >
          Your trip has changes that haven&apos;t been saved yet, including activities, notes, and conversations with Luna. If you leave now, those changes will be lost.
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Save and Leave */}
          <button
            onClick={onSaveAndLeave}
            disabled={isSaving}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              backgroundColor: '#FF8210',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '13px 20px',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 600,
              fontSize: '14px',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.7 : 1,
              transition: 'opacity 0.2s, transform 0.1s',
            }}
          >
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save trip and leave'}
          </button>

          {/* Leave without saving */}
          <button
            onClick={onLeaveWithoutSaving}
            disabled={isSaving}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              backgroundColor: 'transparent',
              color: '#6C6D6F',
              border: '1.5px solid #C0C0C0',
              borderRadius: '10px',
              padding: '13px 20px',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 500,
              fontSize: '14px',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.5 : 1,
            }}
          >
            <LogOut size={16} />
            Leave without saving
          </button>

          {/* Stay */}
          <button
            onClick={onStay}
            style={{
              backgroundColor: 'transparent',
              color: '#00447B',
              border: 'none',
              padding: '8px',
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Stay on this page
          </button>
        </div>
      </div>
    </div>
  );
}
