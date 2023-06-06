import React, { useState } from "react";
import Modal from "react-modal";

const PrivacyPolicy = () => {
  const [isOpen, setIsOpen] = useState(false);

  const openPrivacyPolicy = () => {
    setIsOpen(true);
  };

  const closePrivacyPolicy = () => {
    setIsOpen(false);
  };

  return (
    <div>
      <a className="privacy-policy-link" onClick={openPrivacyPolicy}>
        Privacy Policy
      </a>

      <Modal
        isOpen={isOpen}
        onRequestClose={closePrivacyPolicy}
        contentLabel="Privacy Policy"
        className="privacy-policy-modal"
        ariaHideApp={false}
      >
        <h2>Privacy Policy</h2>

        <div>
          <p>
            <h4> 1. PERSONAL INFORMATION</h4> We may collect personal
            information from Users in order to facilitate their participation on
            beastgoat.net. Personal information includes the User's google ID
            and email address.
          </p>

          <p>
            <h4> 2. USE OF COLLECTED INFORMATION</h4> The personal information
            we collect from Users is used solely for the purpose of facilitating
            their participation on bestgoat.net, including counting the votes
            and analyzing website traffic.{" "}
          </p>

          <p>
            <h4> 3. PROTECTION OF INFORMATION</h4> We implement reasonable
            security measures to protect the personal information collected from
            Users. However, we cannot guarantee the security of data
            transmission over the internet or the security of any information
            stored on our systems.
          </p>

          <p>
            <h4>4. COOKIES </h4>We may use cookies to enhance User experience
            and collect non-personal identification information. Users can
            choose to refuse cookies or set their browsers to alert them when
            cookies are being used.
          </p>

          <p>
            <h4>5. CHANGES TO THIS PRIVACY POLICY</h4> We reserve the right to
            update or modify this Privacy Policy at any time. By using our Site,
            Users signify their acceptance of this policy. If you do not agree
            to this policy, please do not use our Site. Your continued use of
            the Site following the posting of changes to this policy will be
            deemed your acceptance of those changes. If you have any questions
            about this Privacy Policy, please contact us at
            bestgoat2023@gmail.com
          </p>
        </div>

        <a onClick={closePrivacyPolicy}>Close</a>
      </Modal>
    </div>
  );
};

export default PrivacyPolicy;
