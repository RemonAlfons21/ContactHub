var contactNameInput = document.getElementById("fullName");
var contactPhoneInput = document.getElementById("phoneNumber");
var countryCodeInput = document.getElementById("countryCode");
var contactEmailInput = document.getElementById("emailAddress");
var contactAddressInput = document.getElementById("address");
var contactGroupInput = document.getElementById("group");
var ContactType1Input = document.getElementById("favorite");
var ContactType2Input = document.getElementById("emergency");
var contactsArea = document.getElementById("contactsContainer");
var favoriteContactsArea = document.getElementById("favoriteArea");
var emergencyContactsArea = document.getElementById("emergencyArea");
var contactCount = document.getElementById("contactCount");
var emergencyCount = document.getElementById("emergencyCount");
var favoriteCount = document.getElementById("favoriteCount");
var totalCount = document.getElementById("totalCount");
var saveContactBtn = document.getElementById("saveContactBtn");
var saveContactBtnText = document.getElementById("saveContactBtnText");
var contactForm = document.getElementById("contactForm");
var staticBackdrop = document.getElementById("staticBackdrop");
var noteInput = document.getElementById("note");
var themeToggleBtn = document.getElementById("themeToggleBtn");
var themeToggleIcon = document.getElementById("themeToggleIcon");
var getApiBtn = document.getElementById("getApiBtn");

var contactList;
var favoriteList;
var emergencyList;
var activeContactIndex = null;

function setColorTheme(theme) {
  var isDark = theme === "dark";
  document.documentElement.setAttribute(
    "data-bs-theme",
    isDark ? "dark" : "light",
  );
  themeToggleBtn.setAttribute("aria-pressed", String(isDark));
  themeToggleBtn.setAttribute(
    "aria-label",
    isDark ? "Switch to light mode" : "Switch to dark mode",
  );
  themeToggleBtn.title = isDark
    ? "Switch to light mode"
    : "Switch to dark mode";
  themeToggleIcon.classList.toggle("fa-moon", !isDark);
  themeToggleIcon.classList.toggle("fa-sun", isDark);
  localStorage.setItem("contacthub-theme", isDark ? "dark" : "light");
}

themeToggleBtn.addEventListener("click", function () {
  var currentTheme = document.documentElement.getAttribute("data-bs-theme");
  setColorTheme(currentTheme === "dark" ? "light" : "dark");
});

getApiBtn.addEventListener("click", async function () {
  getApiBtn.disabled = true;
  getApiBtn.innerHTML =
    '<span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>Loading...';

  try {
    var response = await fetch("https://catfact.ninja/fact");
    if (!response.ok) {
      throw new Error("The cat fact service returned an error.");
    }

    var data = await response.json();
    if (typeof data.fact !== "string" || !data.fact.trim()) {
      throw new Error("The cat fact service returned an invalid response.");
    }

    await Swal.fire({
      title: "Cat Fact",
      text: data.fact,
      icon: "info",
    });
  } catch (error) {
    await Swal.fire({
      title: "Unable to get a cat fact",
      text: error.message,
      icon: "error",
    });
  } finally {
    getApiBtn.disabled = false;
    getApiBtn.innerHTML =
      '<i class="fa-solid fa-cat me-1" aria-hidden="true"></i>Get Cat Fact';
  }
});

function populatePhoneCountries() {
  var countryNames = new Intl.DisplayNames(["en"], { type: "region" });
  var countries = libphonenumber.getCountries().map(function (country) {
    return {
      code: country,
      name: countryNames.of(country),
      callingCode: libphonenumber.getCountryCallingCode(country),
    };
  });

  countries.sort(function (firstCountry, secondCountry) {
    return firstCountry.name.localeCompare(secondCountry.name);
  });

  countries.forEach(function (country) {
    var option = document.createElement("option");
    option.value = country.code;
    option.textContent = country.name + " (+" + country.callingCode + ")";
    countryCodeInput.appendChild(option);
  });

  countryCodeInput.value = "EG";
}

populatePhoneCountries();

contactPhoneInput.addEventListener("input", function () {
  contactPhoneInput.setCustomValidity("");
});
contactNameInput.addEventListener("input", function () {
  contactNameInput.setCustomValidity("");
});
contactEmailInput.addEventListener("input", function () {
  contactEmailInput.setCustomValidity("");
});
contactAddressInput.addEventListener("input", function () {
  contactAddressInput.setCustomValidity("");
});
noteInput.addEventListener("input", function () {
  noteInput.setCustomValidity("");
});
countryCodeInput.addEventListener("change", function () {
  contactPhoneInput.setCustomValidity("");
});

function getInternationalPhoneNumber() {
  var phoneInputValue = contactPhoneInput.value.trim();
  if (!phoneInputValue) {
    contactPhoneInput.setCustomValidity("");
    return "";
  }

  var phoneNumber =
    phoneInputValue.charAt(0) === "+"
      ? libphonenumber.parsePhoneNumberFromString(phoneInputValue)
      : libphonenumber.parsePhoneNumberFromString(
          phoneInputValue,
          countryCodeInput.value,
        );

  if (!phoneNumber || !phoneNumber.isValid()) {
    contactPhoneInput.setCustomValidity(
      "Enter a valid phone number for the selected country.",
    );
    return "";
  }

  contactPhoneInput.setCustomValidity("");
  if (phoneNumber.country) {
    countryCodeInput.value = phoneNumber.country;
  }

  return phoneNumber.number;
}

function hasDuplicateContactDetails(phoneNumber) {
  var email = contactEmailInput.value.trim().toLowerCase();
  contactPhoneInput.setCustomValidity("");
  contactEmailInput.setCustomValidity("");

  for (var i = 0; i < contactList.length; i++) {
    if (i === activeContactIndex) continue;

    var existingPhone = contactList[i].phone || "";
    var existingEmail = (contactList[i].email || "").trim().toLowerCase();

    if (phoneNumber && existingPhone === phoneNumber) {
      contactPhoneInput.setCustomValidity(
        "This phone number is already saved for another contact.",
      );
    }
    if (email && existingEmail === email) {
      contactEmailInput.setCustomValidity(
        "This email address is already saved for another contact.",
      );
    }
  }

  return contactPhoneInput.validity.valid && contactEmailInput.validity.valid;
}
// When the user presses Enter inside the modal,
// act exactly like clicking the Add Contact button
staticBackdrop.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    saveContactBtn.click();
  }
});

function validateContactFields() {
  var name = contactNameInput.value.trim();
  contactNameInput.setCustomValidity(
    name.length < 2 ||
      name.length > 60 ||
      !/^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u.test(name)
      ? "Name must be 2 to 60 characters, contain letters, and may include spaces, apostrophes, periods, or hyphens. Numbers and symbols are not allowed."
      : "",
  );

  var email = contactEmailInput.value.trim();
  contactEmailInput.setCustomValidity(
    email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? "Enter a valid email address, for example name@example.com."
      : "",
  );

  var location = contactAddressInput.value.trim();
  contactAddressInput.setCustomValidity(
    location.length > 120 || /[\u0000-\u001F\u007F]/.test(location)
      ? "Location must be 120 characters or fewer."
      : "",
  );
  noteInput.setCustomValidity(
    noteInput.value.length > 500
      ? "Notes must be 500 characters or fewer."
      : "",
  );
}

// Create
function addNewContact(phoneNumber) {
  var contact = {
    name: contactNameInput.value.trim(),
    phone: phoneNumber,
    email: contactEmailInput.value,
    address: contactAddressInput.value,
    group: contactGroupInput.value,
    isFavorite: ContactType1Input.checked,
    isEmergency: ContactType2Input.checked,
    note: noteInput.value,
  };

  contactList.push(contact);
  localStorage.setItem("contacts", JSON.stringify(contactList));

  if (contact.isFavorite === true) {
    favoriteList.push(contact);
  }
  localStorage.setItem("favorites", JSON.stringify(favoriteList));

  if (contact.isEmergency === true) {
    emergencyList.push(contact);
  }
  localStorage.setItem("emergency", JSON.stringify(emergencyList));

  displayContact();
  displayFavorite();
  displayEmergency();
  deleteValuesInInputs();
  updateNumberOfContacts();
}

contactForm.addEventListener("submit", function (e) {
  var phoneNumber = getInternationalPhoneNumber();
  validateContactFields();
  if (!contactForm.reportValidity()) {
    e.preventDefault();
    return;
  }
  if (!hasDuplicateContactDetails(phoneNumber)) {
    e.preventDefault();
    contactForm.reportValidity();
    return;
  }

  e.preventDefault();

  if (activeContactIndex === null) {
    addNewContact(phoneNumber);

    if (window.bootstrap && staticBackdrop) {
      var modal = bootstrap.Modal.getOrCreateInstance(staticBackdrop);
      modal.hide();
    }

    Swal.fire({
      title: "Added!",
      text: "Contact added successfully!",
      icon: "success",
      showConfirmButton: false,
      timer: 1500,
    });
  } else {
    sendUpdateData(phoneNumber);

    Swal.fire({
      title: "Updated!",
      text: "Contact updated successfully!",
      icon: "success",
      showConfirmButton: false,
      timer: 1500,
    });
  }
  if (window.bootstrap && staticBackdrop) {
    var modal = bootstrap.Modal.getOrCreateInstance(staticBackdrop);
    modal.hide();
  }
});

//load data from local storage
if (localStorage.getItem("contacts")) {
  contactList = JSON.parse(localStorage.getItem("contacts"));
  displayContact();
} else {
  contactList = [];
}

if (localStorage.getItem("favorites")) {
  favoriteList = JSON.parse(localStorage.getItem("favorites"));
} else {
  favoriteList = [];
}

if (localStorage.getItem("emergency")) {
  emergencyList = JSON.parse(localStorage.getItem("emergency"));
} else {
  emergencyList = [];
}
displayFavorite();
displayEmergency();

// Read
function displayContact() {
  var box = ``;
  if (contactList.length === 0) {
    box = `
      <div class="col-12 text-center text-body-tertiary py-5">
        <i class="fa-solid fa-address-book fs-1 mb-3"></i>
        <p class="m-0 fw-bolder">No contacts yet.</p>
        <p class="m-0 mt-1">Add your first contact to get started.</p>
      </div>
    `;
  } else {
    for (var i = 0; i < contactList.length; i++) {
      box += `
        <div class="col">
          <div class="card border-0 shadow-sm rounded-4 h-100" style="width: 100%; max-width: 320px; margin: 0 auto;">
            <div class="card-body p-4">
              <div class="d-flex justify-content-between align-items-start mb-3">
                <div class="d-flex align-items-center gap-3 contact-summary">
                  <div class="contact-avatar rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold">
                    ${contactList[i].name ? contactList[i].name.charAt(0).toUpperCase() : "A" || contactList[i].phone.charAt(0).toUpperCase()}
                  </div>

                  <div class="contact-summary">
                    <h5 class="contact-name fw-bolder mb-1">${contactList[i].name || contactList[i].phone}</h5>
                    <span class="badge text-bg-primary rounded-pill">
                      ${contactList[i].group || "General"}
                    </span>
                  </div>
                </div>

                <div class="d-flex gap-2">
                  <button class="btn btn-light btn-sm rounded-circle" type="button" onclick="toggleFavorite(${i})">
                    <i class="${contactList[i].isFavorite ? "fa-solid fa-star text-warning" : "fa-regular fa-star"}"></i>
                  </button>

                  <button class="btn btn-light btn-sm rounded-circle" type="button" onclick="toggleEmergency(${i})">
                    <i class="${contactList[i].isEmergency ? "fa-solid fa-heart-pulse text-danger" : "fa-regular fa-heart-pulse"}"></i>
                  </button>
                </div>
              </div>

              <div class="d-flex flex-column gap-3">
                <div class="d-flex align-items-center gap-3">
                  <div class="d-flex align-items-center justify-content-center bg-body-tertiary rounded-circle" style="width: 34px; height: 34px;">
                    <i class="fa-solid fa-phone text-primary"></i>
                  </div>
                  <span>${contactList[i].phone || "No phone"}</span>
                </div>

                <div class="d-flex align-items-center gap-3">
                  <div class="d-flex align-items-center justify-content-center bg-body-tertiary rounded-circle" style="width: 34px; height: 34px;">
                    <i class="fa-solid fa-envelope text-primary"></i>
                  </div>
                  <span>${contactList[i].email || "No email"}</span>
                </div>

                <div class="d-flex align-items-center gap-3">
                  <div class="d-flex align-items-center justify-content-center bg-body-tertiary rounded-circle" style="width: 34px; height: 34px;">
                    <i class="fa-solid fa-location-dot text-primary"></i>
                  </div>
                  <span>${contactList[i].address || "No address"}</span>
                </div>
              </div>

              <hr>

              <div class="d-flex gap-2">
                    <button
                  class="btn btn-light border flex-fill"
                  id="updateContactBtn"
                  onclick="prepareDataForUpdate(${i})"
                  type="button"
                  data-bs-toggle="modal"
                  data-bs-target="#staticBackdrop"
                >
                  <i class="fa-solid fa-pen me-1"></i>
                  Edit
                </button>

                <button class="btn btn-outline-danger" id="deleteContactBtn" onclick="deleteContact(${i})" type="button">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  }
  contactsArea.innerHTML = box;
}

function displayFavorite() {
  var favoriteBox = "";

  if (favoriteList.length === 0) {
    favoriteBox = `
      <div class="text-center text-body-tertiary py-3">
        <i class="fa-regular fa-star fs-4 mb-2"></i>
        <p class="m-0 fw-bolder">No favorite contacts yet.</p>
        <p class="m-0 mt-1 small">Add a contact to your favorites.</p>
      </div>
    `;
  } else {
    for (var i = 0; i < favoriteList.length; i++) {
      favoriteBox += `
        <div class="card border-0 rounded-4 shadow-sm">
          <div class="card-body p-3">
            <div class="d-flex align-items-center gap-3">
              <div class="bg-warning rounded-circle d-flex align-items-center justify-content-center text-white" style="width: 38px; height: 38px;">
                <i class="fa-solid fa-star"></i>
              </div>
              <div class="contact-summary">
                <h6 class="contact-name m-0 fw-bold">${favoriteList[i].name || "Unnamed Contact"}</h6>
                <p class="m-0 small text-body-secondary">${favoriteList[i].phone || "No phone"}</p>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  }

  favoriteContactsArea.innerHTML = favoriteBox;
}

function displayEmergency() {
  var emergencyBox = "";
  if (emergencyList.length === 0) {
    emergencyBox = `
      <div class="text-center text-body-tertiary py-3">
        <i class="fa-solid fa-heart-pulse fs-4 mb-2"></i>
        <p class="m-0 fw-bolder">No emergency contacts yet.</p>
        <p class="m-0 mt-1 small">Add a contact to your emergency list.</p>
      </div>
    `;
  } else {
    for (var i = 0; i < emergencyList.length; i++) {
      emergencyBox += `
        <div class="card border-0 rounded-4 shadow-sm">
          <div class="card-body p-3">
            <div class="d-flex align-items-center gap-3">
              <div class="bg-danger rounded-circle d-flex align-items-center justify-content-center text-white" style="width: 38px; height: 38px;">
                <i class="fa-solid fa-ambulance"></i>
              </div>
              <div class="contact-summary">
                <h6 class="contact-name m-0 fw-bold">${emergencyList[i].name || "Unnamed Contact"}</h6>
                <p class="m-0 small text-body-secondary">${emergencyList[i].phone || "No phone"}</p>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  }

  emergencyContactsArea.innerHTML = emergencyBox;
}

function updateContactFlag(index, flag) {
  var contact = contactList[index];
  if (!contact) return;

  contact[flag] = !contact[flag];
  favoriteList = contactList.filter(function (item) {
    return item.isFavorite === true;
  });
  emergencyList = contactList.filter(function (item) {
    return item.isEmergency === true;
  });

  localStorage.setItem("contacts", JSON.stringify(contactList));
  localStorage.setItem("favorites", JSON.stringify(favoriteList));
  localStorage.setItem("emergency", JSON.stringify(emergencyList));
  displayContact();
  displayFavorite();
  displayEmergency();
  updateNumberOfContacts();
}

function toggleFavorite(index) {
  updateContactFlag(index, "isFavorite");
}

function toggleEmergency(index) {
  updateContactFlag(index, "isEmergency");
}

// Delete
function deleteContact(index) {
  Swal.fire({
    title: "Are you sure?",
    text: `You want to delete this contact ${contactList[index].name}?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, delete it!",
  }).then((result) => {
    if (result.isConfirmed) {
      contactList.splice(index, 1);

      favoriteList = contactList.filter(function (contact) {
        return contact.isFavorite === true;
      });
      emergencyList = contactList.filter(function (contact) {
        return contact.isEmergency === true;
      });
      localStorage.setItem("contacts", JSON.stringify(contactList));
      localStorage.setItem("favorites", JSON.stringify(favoriteList));
      localStorage.setItem("emergency", JSON.stringify(emergencyList));
      displayContact();
      displayFavorite();
      displayEmergency();
      updateNumberOfContacts();
      Swal.fire({
        title: "Deleted!",
        text: "Your file has been deleted.",
        icon: "success",
        showConfirmButton: false,
        timer: 1000,
      });
    }
  });
}

function deleteValuesInInputs() {
  contactNameInput.value = "";
  contactPhoneInput.value = "";
  contactPhoneInput.setCustomValidity("");
  countryCodeInput.value = "EG";
  contactEmailInput.value = "";
  contactAddressInput.value = "";
  contactGroupInput.value = "";
  ContactType1Input.checked = false;
  ContactType2Input.checked = false;
  noteInput.value = "";
  activeContactIndex = null;
  saveContactBtnText.textContent = "Add Contact";
}
staticBackdrop.addEventListener("hidden.bs.modal", function () {
  deleteValuesInInputs();
});

// Update
function updateNumberOfContacts() {
  contactCount.textContent = contactList.length;
  favoriteCount.textContent = favoriteList.length;
  emergencyCount.textContent = emergencyList.length;
  totalCount.textContent = contactList.length;

  localStorage.setItem("contactCount", JSON.stringify(contactList.length));
  localStorage.setItem("totalCount", JSON.stringify(contactList.length));
  localStorage.setItem("favoriteCount", JSON.stringify(favoriteList.length));
  localStorage.setItem("emergencyCount", JSON.stringify(emergencyList.length));
}
// Load counts from local storage on page load
if (localStorage.getItem("contactCount")) {
  contactCount.textContent = JSON.parse(localStorage.getItem("contactCount"));
}
if (localStorage.getItem("totalCount")) {
  totalCount.textContent = JSON.parse(localStorage.getItem("totalCount"));
}
if (localStorage.getItem("favoriteCount")) {
  favoriteCount.textContent = JSON.parse(localStorage.getItem("favoriteCount"));
}
if (localStorage.getItem("emergencyCount")) {
  emergencyCount.textContent = JSON.parse(
    localStorage.getItem("emergencyCount"),
  );
}

function prepareDataForUpdate(index) {
  activeContactIndex = index;

  var selectedContact = contactList[index];
  if (!selectedContact) return;
  saveContactBtnText.textContent = "Update Contact";

  contactNameInput.value = selectedContact.name;
  countryCodeInput.value = "EG";
  contactPhoneInput.value = selectedContact.phone || "";
  if (contactPhoneInput.value.charAt(0) === "+") {
    var parsedPhone = libphonenumber.parsePhoneNumberFromString(
      contactPhoneInput.value,
    );
    if (parsedPhone) {
      if (parsedPhone.country) {
        countryCodeInput.value = parsedPhone.country;
      }
      contactPhoneInput.value = parsedPhone.formatNational();
    }
  }
  contactEmailInput.value = selectedContact.email;
  contactAddressInput.value = selectedContact.address;
  contactGroupInput.value = selectedContact.group;
  ContactType1Input.checked = !!selectedContact.isFavorite;
  ContactType2Input.checked = !!selectedContact.isEmergency;
  noteInput.value = selectedContact.note;

  if (window.bootstrap && staticBackdrop) {
    bootstrap.Modal.getOrCreateInstance(staticBackdrop).show();
  }
}

function sendUpdateData(phoneNumber) {
  if (activeContactIndex === null) return;

  contactList[activeContactIndex] = {
    name: contactNameInput.value.trim(),
    phone: phoneNumber,
    email: contactEmailInput.value,
    address: contactAddressInput.value,
    group: contactGroupInput.value,
    isFavorite: ContactType1Input.checked,
    isEmergency: ContactType2Input.checked,
    note: noteInput.value,
  };

  favoriteList = contactList.filter(function (contact) {
    return contact.isFavorite === true;
  });

  emergencyList = contactList.filter(function (contact) {
    return contact.isEmergency === true;
  });

  localStorage.setItem("contacts", JSON.stringify(contactList));
  localStorage.setItem("favorites", JSON.stringify(favoriteList));
  localStorage.setItem("emergency", JSON.stringify(emergencyList));
  displayContact();
  displayFavorite();
  displayEmergency();
  updateNumberOfContacts();
  deleteValuesInInputs();
}
