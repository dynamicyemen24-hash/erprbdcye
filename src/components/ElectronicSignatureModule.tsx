import React, { useState } from 'react';
import SignatureModal from './SignatureModal';
import { verifySignature } from '../core/security/signature';

interface ElectronicSignatureModuleProps {
  lang: 'ar' | 'en';
  currentUser: any;
  actionDetails: string;
  onVerifiedSign: (signature: any) => void;
  children: (triggerSignature: () => void) => React.ReactNode;
}

export default function ElectronicSignatureModule({ 
  lang, 
  currentUser, 
  actionDetails, 
  onVerifiedSign,
  children 
}: ElectronicSignatureModuleProps) {
  const [showModal, setShowModal] = useState(false);

  const handleSign = async (signature: any) => {
    const isValid = await verifySignature(signature, actionDetails);
    if (isValid) {
      onVerifiedSign(signature);
      setShowModal(false);
    } else {
      console.error('Signature verification failed');
      // Should ideally notify user
    }
  };

  return (
    <>
      {children(() => setShowModal(true))}
      {showModal && (
        <SignatureModal
          lang={lang}
          currentUser={currentUser}
          actionDetails={actionDetails}
          onSign={handleSign}
          onCancel={() => setShowModal(false)}
        />
      )}
    </>
  );
}
