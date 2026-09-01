import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import "./contacts.css";

// ==========================================
// GET DISPLAY NAME
// ==========================================

const getDisplayName = (person) => {
  if (!person) {
    return "User";
  }

  return (
    person?.nickname ||
    person?.fullName ||
    person?.displayName ||
    person?.username ||
    "User"
  );
};

// ==========================================
// GET AVATAR
// ==========================================

const getAvatar = (person) => {
  const name = getDisplayName(person);

  return (
    person?.profilePhoto ||
    person?.avatar ||
    name.charAt(0).toUpperCase() ||
    "U"
  );
};

// ==========================================
// GET CONTACT USER
// ==========================================

const getContactUser = (record) => {
  if (!record) {
    return null;
  }

  return (
    record.contact ||
    record.user ||
    record
  );
};

// ==========================================
// NORMALIZE PHONE
// ==========================================

const normalizePhone = (code, rawPhone) => {
  if (!rawPhone) return "";
  let cleaned = String(rawPhone).replace(/[^\d]/g, "");
  cleaned = cleaned.replace(/^0+/, "");
  const cleanCode = String(code || "").startsWith("+")
    ? code
    : `+${code || ""}`;
  return `${cleanCode}${cleaned}`;
};

// ==========================================
// CONTACT CARD
// ==========================================

function ContactCard({
  contact,
  onOpenChat,
  onCall,
  onVideoCall,
  onToggleFavorite,
  onRemove,
  isFavoriteLoading,
}) {
  const person = getContactUser(contact);

  if (!person) {
    return null;
  }

  const personId =
    person?._id ||
    person?.id ||
    person?.userId;

  const name = getDisplayName(contact);

  const username = person?.username
    ? `@${String(person.username).replace(/^@/, "")}`
    : "";

  const avatar = getAvatar(person);

  const conversationId = contact?.conversationId || "";

  const chat = {
    id: personId,
    _id: personId,
    userId: personId,
    conversationId,
    name,
    fullName: person?.fullName || "",
    username: person?.username || "",
    phone: person?.phone || "",
    profilePhoto: person?.profilePhoto || person?.avatar || "",
    avatar,
    favorite: Boolean(contact?.favorite),
  };

  return (
    <article className="contact-card">
      <button
        type="button"
        className="contact-main"
        onClick={() => onOpenChat?.(chat)}
      >
        <div className="contact-avatar">
          {person?.profilePhoto ? (
            <img src={person.profilePhoto} alt={name} />
          ) : (
            avatar
          )}
        </div>

        <div className="contact-information">
          <h3>{name}</h3>
          {username && <span>{username}</span>}
          {person?.phone && <small>{person.phone}</small>}
        </div>
      </button>

      <div className="contact-actions">
        <button
          type="button"
          className="contact-action call"
          onClick={() => onCall?.(chat)}
          aria-label={`Call ${name}`}
          title={`Call ${name}`}
        >
          <span aria-hidden="true">📞</span>
        </button>

        <button
          type="button"
          className="contact-action video"
          onClick={() => onVideoCall?.(chat)}
          aria-label={`Video call ${name}`}
          title={`Video call ${name}`}
        >
          <span aria-hidden="true">🎥</span>
        </button>

        <button
          type="button"
          className={
            contact?.favorite
              ? "contact-action favorite active"
              : "contact-action favorite"
          }
          onClick={() => onToggleFavorite?.(contact)}
          disabled={isFavoriteLoading}
          aria-label={
            contact?.favorite
              ? "Remove from favorites"
              : "Add to favorites"
          }
          title={
            contact?.favorite
              ? "Remove from favorites"
              : "Add to favorites"
          }
        >
          {contact?.favorite ? "★" : "☆"}
        </button>

        <button
          type="button"
          className="contact-action remove"
          onClick={() => onRemove?.(contact)}
          aria-label="Remove contact"
          title="Remove contact"
        >
          ⋮
        </button>
      </div>
    </article>
  );
}

// ==========================================
// CONTACTS PAGE
// ==========================================

function Contacts({
  user,
  onOpenChat,
  onCall,
  onVideoCall,
  onNavigate,
}) {
  const API_URL =
    process.env.REACT_APP_API_URL ||
    "https://joseph-backend.onrender.com";

  const currentUserId =
    user?._id || user?.id || user?.userId;

  const [activeSection, setActiveSection] = useState("contacts");
  const [contacts, setContacts] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [recentlyContacted, setRecentlyContacted] = useState([]);

  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const [contactError, setContactError] = useState("");

  const [invitationPhone, setInvitationPhone] = useState("");
  const [showInvitation, setShowInvitation] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  const [actionContactId, setActionContactId] = useState("");
  const [showAddContact, setShowAddContact] = useState(false);

  const [newContact, setNewContact] = useState({
    firstName: "",
    lastName: "",
    username: "",
    countryCode: "+237",
    phone: "",
    syncToPhone: true,
  });

  const handleContactInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewContact((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetContactForm = () => {
    setNewContact({
      firstName: "",
      lastName: "",
      username: "",
      countryCode: "+237",
      phone: "",
      syncToPhone: true,
    });
  };

  const loadContacts = useCallback(async () => {
    if (!currentUserId) {
      setIsLoadingContacts(false);
      return;
    }

    try {
      setIsLoadingContacts(true);
      const response = await fetch(
        `${API_URL}/api/contacts?userId=${encodeURIComponent(
          currentUserId
        )}`
      );
      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Unable to load contacts.");
      }

      setContacts(Array.isArray(data.contacts) ? data.contacts : []);
    } catch (error) {
      console.error("Load contacts error:", error);
      setContactError(error?.message || "Unable to load your contacts.");
    } finally {
      setIsLoadingContacts(false);
    }
  }, [API_URL, currentUserId]);

  const loadFavorites = useCallback(async () => {
    if (!currentUserId) return;

    try {
      setIsLoadingFavorites(true);
      const response = await fetch(
        `${API_URL}/api/contacts/favorites?userId=${encodeURIComponent(
          currentUserId
        )}`
      );
      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Unable to load favorites.");
      }

      setFavorites(Array.isArray(data.contacts) ? data.contacts : []);
    } catch (error) {
      console.error("Load favorites error:", error);
    } finally {
      setIsLoadingFavorites(false);
    }
  }, [API_URL, currentUserId]);

  const loadRecentlyContacted = useCallback(async () => {
    if (!currentUserId) return;

    try {
      setIsLoadingRecent(true);
      const response = await fetch(
        `${API_URL}/api/contacts/recently-contacted?userId=${encodeURIComponent(
          currentUserId
        )}`
      );
      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message || "Unable to load recently contacted users."
        );
      }

      setRecentlyContacted(
        Array.isArray(data.contacts) ? data.contacts : []
      );
    } catch (error) {
      console.error("Load recently contacted error:", error);
    } finally {
      setIsLoadingRecent(false);
    }
  }, [API_URL, currentUserId]);

  useEffect(() => {
    loadContacts();
    loadFavorites();
    loadRecentlyContacted();
  }, [loadContacts, loadFavorites, loadRecentlyContacted]);

  const filteredContacts = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return contacts;

    return contacts.filter((record) => {
      const person = getContactUser(record);
      const name = getDisplayName(record).toLowerCase();
      const username = String(person?.username || "").toLowerCase();
      const phone = String(person?.phone || "").toLowerCase();

      return (
        name.includes(query) ||
        username.includes(query) ||
        phone.includes(query)
      );
    });
  }, [contacts, searchQuery]);

  const handleOpenContact = async (chat) => {
    if (!chat) return;

    const contactUserId = chat?._id || chat?.id || chat?.userId;

    if (currentUserId && contactUserId) {
      try {
        await fetch(`${API_URL}/api/contacts/recently-contacted`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUserId,
            contactUserId,
          }),
        });
      } catch (error) {
        console.warn("Recently contacted update failed:", error);
      }
    }

    if (onOpenChat) {
      onOpenChat(chat);
    }
  };

  const handleAddContact = async (event) => {
    event.preventDefault();

    const normalizedPhone = normalizePhone(
      newContact.countryCode,
      newContact.phone
    );

    if (!newContact.phone.trim()) {
      setContactError("Enter a phone number.");
      return;
    }

    if (!currentUserId) {
      setContactError("Your account information is missing.");
      return;
    }

    try {
      setIsAddingContact(true);
      setContactError("");
      setContactMessage("");

      const fullName = `${newContact.firstName.trim()} ${newContact.lastName.trim()}`.trim();

      const response = await fetch(`${API_URL}/api/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUserId,
          phone: normalizedPhone,
          fullName,
          firstName: newContact.firstName,
          lastName: newContact.lastName,
          username: newContact.username,
          syncToPhone: newContact.syncToPhone,
        }),
      });

      const data = await response.json();

      if (response.status === 409 && data?.registered) {
        setContactError("This person is already in your contacts.");
        return;
      }

      if (!response.ok) {
        if (data?.registered === false && data?.invitation) {
          setInvitationPhone(normalizedPhone);
          setShowInvitation(true);
          return;
        }

        throw new Error(data?.message || "Unable to add contact.");
      }

      if (data?.registered === false && data?.invitation) {
        setInvitationPhone(normalizedPhone);
        setShowInvitation(true);
        return;
      }

      setContactMessage(data?.message || "Contact added successfully.");
      resetContactForm();
      setShowAddContact(false);

      await loadContacts();
      await loadFavorites();
    } catch (error) {
      console.error("Add contact error:", error);
      setContactError(error?.message || "Unable to add contact.");
    } finally {
      setIsAddingContact(false);
    }
  };

  const handleInvite = async () => {
    if (!invitationPhone || !currentUserId) return;

    try {
      setIsInviting(true);
      setContactError("");

      const response = await fetch(`${API_URL}/api/contacts/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUserId,
          phone: invitationPhone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Unable to create invitation.");
      }

      setShowInvitation(false);
      setInvitationPhone("");
      setContactMessage(
        data?.message || "Invitation created successfully."
      );
    } catch (error) {
      console.error("Invitation error:", error);
      setContactError(error?.message || "Unable to create invitation.");
    } finally {
      setIsInviting(false);
    }
  };

  const handleToggleFavorite = async (contact) => {
    const person = getContactUser(contact);
    const contactUserId = person?._id || person?.id || person?.userId;

    if (!currentUserId || !contactUserId) return;

    try {
      setActionContactId(String(contactUserId));

      const response = await fetch(`${API_URL}/api/contacts/favorite`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUserId,
          contactId: contactUserId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Unable to update favorite.");
      }

      await loadContacts();
      await loadFavorites();
    } catch (error) {
      console.error("Favorite error:", error);
      setContactError(error?.message || "Unable to update favorite.");
    } finally {
      setActionContactId("");
    }
  };

  const handleRemove = async (contact) => {
    const person = getContactUser(contact);
    const contactUserId = person?._id || person?.id || person?.userId;

    if (!currentUserId || !contactUserId) return;

    const name = getDisplayName(contact);
    if (!window.confirm(`Remove ${name} from your contacts?`)) return;

    try {
      setActionContactId(String(contactUserId));

      const response = await fetch(
        `${API_URL}/api/contacts/${contactUserId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUserId }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Unable to remove contact.");
      }

      await loadContacts();
      await loadFavorites();
      await loadRecentlyContacted();
    } catch (error) {
      console.error("Remove contact error:", error);
      setContactError(error?.message || "Unable to remove contact.");
    } finally {
      setActionContactId("");
    }
  };

  const activeContacts =
    activeSection === "favorites"
      ? favorites
      : activeSection === "recent"
      ? recentlyContacted
      : filteredContacts;

  const sectionTitle =
    activeSection === "favorites"
      ? "Favorites"
      : activeSection === "recent"
      ? "Recently contacted"
      : "My contacts";

  return (
    <div className="contacts-page">
      <header className="contacts-header">
        <div className="contacts-header-left">
          <button
            type="button"
            className="contacts-back-button"
            onClick={() => onNavigate?.("chats")}
            aria-label="Back to chats"
          >
            ←
          </button>
          <div>
            <h1>Contacts</h1>
            <span>Manage your ZenvaZapp contacts</span>
          </div>
        </div>

        <button
          type="button"
          className="contacts-add-header-button"
          onClick={() => setShowAddContact(true)}
        >
          +
        </button>
      </header>

      <section className="contacts-search-section">
        <div className="contacts-search">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search your contacts..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            aria-label="Search contacts"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </section>

      <section className="contacts-tabs">
        <button
          type="button"
          className={
            activeSection === "contacts"
              ? "contacts-tab active"
              : "contacts-tab"
          }
          onClick={() => setActiveSection("contacts")}
        >
          <span>👥</span> Contacts
        </button>

        <button
          type="button"
          className={
            activeSection === "favorites"
              ? "contacts-tab active"
              : "contacts-tab"
          }
          onClick={() => setActiveSection("favorites")}
        >
          <span>★</span> Favorites
        </button>

        <button
          type="button"
          className={
            activeSection === "recent"
              ? "contacts-tab active"
              : "contacts-tab"
          }
          onClick={() => setActiveSection("recent")}
        >
          <span>🕘</span> Recent
        </button>
      </section>

      {showAddContact && (
        <section className="add-contact-panel whatsapp-style-panel">
          <div className="add-contact-heading">
            <div className="add-contact-title-group">
              <button
                type="button"
                className="add-contact-back-btn"
                onClick={() => {
                  setShowAddContact(false);
                  resetContactForm();
                  setContactError("");
                }}
                aria-label="Back"
              >
                ←
              </button>
              <h2>New contact</h2>
            </div>

            <button
              type="button"
              className="qr-icon-btn"
              aria-label="QR Code"
            >
              🔲
            </button>
          </div>

          <form onSubmit={handleAddContact} className="whatsapp-contact-form">
            <div className="form-input-row">
              <span className="form-icon">👤</span>
              <div className="form-input-wrapper">
                <input
                  type="text"
                  name="firstName"
                  placeholder="First name"
                  value={newContact.firstName}
                  onChange={handleContactInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-input-row">
              <span className="form-icon"></span>
              <div className="form-input-wrapper">
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last name"
                  value={newContact.lastName}
                  onChange={handleContactInputChange}
                />
              </div>
            </div>

            <div className="form-input-row">
              <span className="form-icon">@</span>
              <div className="form-input-wrapper">
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={newContact.username}
                  onChange={handleContactInputChange}
                />
              </div>
            </div>

            <div className="form-input-row">
              <span className="form-icon">📞</span>
              <div className="phone-fields-group">
                <div className="form-input-wrapper country-code-wrapper">
                  <span className="field-label">Country</span>
                  <select
                    name="countryCode"
                    value={newContact.countryCode}
                    onChange={handleContactInputChange}
                  >
                    <option value="+237">CM +237</option>
                    <option value="+1">US +1</option>
                    <option value="+44">UK +44</option>
                    <option value="+234">NG +234</option>
                  </select>
                </div>
                <div className="form-input-wrapper phone-number-wrapper">
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone"
                    value={newContact.phone}
                    onChange={handleContactInputChange}
                  />
                </div>
              </div>
            </div>

            <div className="form-input-row sync-option-row">
              <span className="form-icon">🔄</span>
              <div className="sync-option-container">
                <div className="sync-option-text">
                  <strong>Sync contact to phone</strong>
                  <p>Only contacts with a phone number can be synced</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    name="syncToPhone"
                    checked={newContact.syncToPhone}
                    onChange={handleContactInputChange}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="form-submit-wrapper">
              <button
                type="submit"
                className="save-contact-btn"
                disabled={isAddingContact || !newContact.firstName.trim()}
              >
                {isAddingContact ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </section>
      )}

      {showInvitation && (
        <div className="contacts-modal-overlay">
          <div className="contacts-modal">
            <div className="contacts-modal-icon">✉</div>
            <h2>This number isn't on ZenvaZapp</h2>
            <p>
              {invitationPhone} is not registered yet. Would you like to invite this person to ZenvaZapp?
            </p>

            <div className="contacts-modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setShowInvitation(false)}
              >
                Not now
              </button>
              <button
                type="button"
                onClick={handleInvite}
                disabled={isInviting}
              >
                {isInviting ? "Creating..." : "Invite"}
              </button>
            </div>
          </div>
        </div>
      )}

      {contactMessage && (
        <div className="contacts-success">
          <span>✓</span>
          {contactMessage}
          <button type="button" onClick={() => setContactMessage("")}>
            ×
          </button>
        </div>
      )}

      {contactError && (
        <div className="contacts-error">
          <span>{contactError}</span>
          <button type="button" onClick={() => setContactError("")}>
            ×
          </button>
        </div>
      )}

      <main className="contacts-content">
        <div className="contacts-section-heading">
          <div>
            <h2>{sectionTitle}</h2>
            <span>
              {activeContacts.length}{" "}
              {activeContacts.length === 1 ? "person" : "people"}
            </span>
          </div>

          {activeSection === "contacts" && (
            <button
              type="button"
              className="add-contact-button"
              onClick={() => setShowAddContact(true)}
            >
              + Add contact
            </button>
          )}
        </div>

        {(activeSection === "contacts" && isLoadingContacts) ||
        (activeSection === "favorites" && isLoadingFavorites) ||
        (activeSection === "recent" && isLoadingRecent) ? (
          <div className="contacts-empty-state">
            <div className="contacts-loading-spinner" />
            <h3>Loading contacts...</h3>
            <p>Please wait while ZenvaZapp loads your contacts.</p>
          </div>
        ) : activeContacts.length === 0 ? (
          <div className="contacts-empty-state">
            <div className="contacts-empty-icon">
              {activeSection === "favorites"
                ? "★"
                : activeSection === "recent"
                ? "🕘"
                : searchQuery
                ? "🔎"
                : "👥"}
            </div>
            <h3>
              {activeSection === "favorites"
                ? "No favorites yet"
                : activeSection === "recent"
                ? "No recent contacts"
                : searchQuery
                ? "No contacts found"
                : "No contacts yet"}
            </h3>
            <p>
              {activeSection === "favorites"
                ? "Contacts you mark as favorites will appear here."
                : activeSection === "recent"
                ? "People you recently contacted will appear here."
                : searchQuery
                ? "Try another name, username or phone number."
                : "Add someone using their phone number to start connecting."}
            </p>

            {activeSection === "contacts" && !searchQuery && (
              <button
                type="button"
                className="contacts-empty-action"
                onClick={() => setShowAddContact(true)}
              >
                Add contact
              </button>
            )}
          </div>
        ) : (
          <div className="contacts-list">
            {activeContacts.map((contact, index) => {
              const person = getContactUser(contact);
              const personId =
                person?._id || person?.id || person?.userId;
              const contactKey =
                personId || contact?._id || `contact-${index}`;

              return (
                <ContactCard
                  key={contactKey}
                  contact={contact}
                  onOpenChat={handleOpenContact}
                  onCall={onCall}
                  onVideoCall={onVideoCall}
                  onToggleFavorite={handleToggleFavorite}
                  onRemove={handleRemove}
                  isFavoriteLoading={
                    actionContactId === String(personId || "")
                  }
                />
              );
            })}
          </div>
        )}
      </main>

      <nav className="contacts-bottom-navigation" aria-label="Main navigation">
        <button type="button" onClick={() => onNavigate?.("chats")}>
          <span>💬</span>
          <small>Chats</small>
        </button>
        <button
          type="button"
          className="active"
          onClick={() => onNavigate?.("contacts")}
        >
          <span>👥</span>
          <small>Contacts</small>
        </button>
        <button type="button" onClick={() => onNavigate?.("tools")}>
          <span>🛠</span>
          <small>Tools</small>
        </button>
        <button type="button" onClick={() => onNavigate?.("settings")}>
          <span>⚙️</span>
          <small>Settings</small>
        </button>
      </nav>
    </div>
  );
}

export default Contacts;