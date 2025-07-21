// ** DOM-elements **
const product = {
  form: document.getElementById("product-form"),
  textInput: document.getElementById("product-text-input"),
  alertPopup: document.getElementById("product-form").querySelector(".alert"),
  list: document.getElementById("product-ordered-list"),
};

const modal = {
  formContainer: document.getElementById("modal-1"),
  form: document.getElementById("modal-form"),
  textInput: document.getElementById("modal-text-input"),
  cancelBtn: document.getElementById("modal-cancel-button"),
  alertPopup: document.getElementById("modal-form").querySelector(".alert"),
  confirmContainer: document.getElementById("modal-2"),
  yesBtn: document.getElementById("modal-yes-button"),
  noBtn: document.getElementById("modal-no-button"),
};

const control = {
  checkTooltip: document.getElementById("check-button").querySelector(".tooltip"),
  checkbox: document.getElementById("toggle-all-checkbox"),
  checkBtn: document.getElementById("check-button"),
  actionBtn: document.getElementById("action-button"),
  actionList: document.getElementById("action-unordered-list"),
  sortBtn: document.getElementById("sort-button"),
  sortInfoPopup: document.getElementById("sort-button").querySelector(".sort-type-info"),
  formBtn: document.getElementById("form-button"),
  showBtn: document.getElementById("show-button"),
  selectBtn: document.getElementById("select-button"),
  selectList: document.getElementById("select-unordered-list"),
};

const action = {
  deleteSelectedBtn: document.getElementById("delete-selected-button"),
  resetColorsBtn: document.getElementById("reset-colors-button"),
  saveToDiskBtn: document.getElementById("save-to-disk-button"),
  deleteFromDiskBtn: document.getElementById("delete-from-disk-button"),
};

// ** Variables **
const productCollection = {}; // general collection containing all list-items added to product.list without "formed-list" class

const listCollection = {}; // collection of lists, e.g. { list1: { Milk: element } }
let currentListName = null; // name of the list that is currently shown in product.list with "formed-list" class, e.g. list1

const selectCollection = []; // array-collection of list-items added to control.selectList where each represents a corresponding list from listCollection

const popupTimerIDs = [];

let sortIndex = 2;

// ** How it works **
// If product.list has "formed-list" class then add-button will add list-item only to listCollection[currentListName] object
// If product.list has "formed-list" class then it shows only list-items that are currently in listCollection[currentListName] object

// If product.list has no "formed-list" class then add-button will add list-item only to productCollection object
// If product.list has no "formed-list" class then it shows only list-items that are currently in productCollection object

// ** Common Functions **
const isFormedListActive = () => product.list.classList.contains("formed-list");

const showPopup = (popup, index, duration = 1800, fading = 200) => {
  popup.style.visibility = "visible";
  popup.style.opacity = 1;
  clearTimeout(popupTimerIDs[index]);
  popupTimerIDs[index] = setTimeout(() => {
    popup.style.opacity = 0;
    setTimeout(() => {
      popup.style.visibility = "hidden";
    }, fading);
  }, duration);
};

const updateControlAndActionBtns = () => {
  if (
    product.list.children.length !== 0 &&
    Array.from(product.list.children).every((listItem) => listItem.querySelector("input").checked)
  ) {
    control.checkbox.checked = true;
    control.checkTooltip.innerHTML = "Remove<br>all";
  } else {
    control.checkbox.checked = false;
    control.checkTooltip.innerHTML = "Select<br>all";
  }

  if (product.list.querySelector("li:has(input:checked)")) {
    control.formBtn.classList.remove("disabled");
    action.deleteSelectedBtn.firstElementChild.classList.remove("disabled");
  } else {
    control.formBtn.classList.add("disabled");
    action.deleteSelectedBtn.firstElementChild.classList.add("disabled");
  }
};

const updateActionResetBtn = () => {
  if (product.list.querySelector("li.selected-product")) {
    action.resetColorsBtn.firstElementChild.classList.remove("disabled");
  } else {
    action.resetColorsBtn.firstElementChild.classList.add("disabled");
  }
};

const updateActionSaveBtn = () => {
  if (Object.keys(productCollection).length !== 0 || selectCollection.length !== 0) {
    action.saveToDiskBtn.firstElementChild.classList.remove("disabled");
  } else {
    action.saveToDiskBtn.firstElementChild.classList.add("disabled");
  }
};

// ** Functions for add-button **
const addProductToListCollection = ({
  productName,
  defaultIndex,
  currentIndex,
  selected,
  listName = currentListName,
}) => {
  const listItem = document.createElement("li");
  listItem.dataset.productName = productName;
  listItem.dataset.defaultIndex = defaultIndex ?? Object.keys(listCollection[listName]).length;
  listItem.dataset.currentIndex = currentIndex ?? listItem.dataset.defaultIndex;
  listItem.innerHTML = `
    <span>${productName}</span>
    <button>✖</button>
  `;

  listItem.addEventListener("click", changeProductColor);
  listItem.querySelector("button").addEventListener("click", removeProductFromProductList);

  listCollection[listName][productName] = listItem;

  if (selected) listItem.classList.add("selected-product");

  action.saveToDiskBtn.firstElementChild.classList.remove("disabled");
};

const addProductToProductCollection = ({ productName, defaultIndex, currentIndex, checked = true }) => {
  const listItem = document.createElement("li");
  listItem.dataset.productName = productName;
  listItem.dataset.defaultIndex = defaultIndex ?? Object.keys(productCollection).length;
  listItem.dataset.currentIndex = currentIndex ?? listItem.dataset.defaultIndex;
  listItem.innerHTML = `
    <div>
      <input class="visually-hidden" type="checkbox" ${checked ? "checked" : ""} />
      <span class="custom-checkbox"></span>
    </div>
    <span>${productName}</span>
    <button>✖</button>
  `;

  listItem.addEventListener("click", toggleProductCheckbox);
  listItem.querySelector("input").addEventListener("change", updateControlAndActionBtns);
  listItem.querySelector("button").addEventListener("click", removeProductFromProductList);

  productCollection[productName] = listItem;

  action.saveToDiskBtn.firstElementChild.classList.remove("disabled");
};

const showProductFromListCollection = (productName, listName = currentListName) => {
  product.list.append(listCollection[listName][productName]);

  if (product.list.children.length > 1) {
    control.sortBtn.classList.remove("disabled");
  }
};

const showProductFromProductCollection = (productName) => {
  product.list.append(productCollection[productName]);
  control.checkBtn.classList.remove("disabled");
  updateControlAndActionBtns();

  if (product.list.children.length > 1) {
    control.sortBtn.classList.remove("disabled");
  }
};

// ** Functions for product (list-item) in product.list **
const toggleProductCheckbox = (e) => {
  if (getSelection().toString().length > 0) return;
  e.currentTarget.querySelector("input").click();
};

const changeProductColor = (e) => {
  e.currentTarget.classList.toggle("selected-product");
  updateActionResetBtn();
};

const removeProductFromProductList = (e) => {
  const listItem = e.target.closest("li");

  listItem.remove();

  if (isFormedListActive()) {
    deleteProductFromListCollection(listItem);
    updateActionResetBtn();
  } else {
    deleteProductFromProductCollection(listItem);
    updateControlAndActionBtns();

    if (product.list.children.length === 0) {
      control.checkBtn.classList.add("disabled");
    }
  }

  updateActionSaveBtn();

  if (product.list.children.length < 2) {
    control.sortBtn.classList.add("disabled");
  }
};

const deleteProductFromListCollection = (listItem, listName = currentListName) => {
  listItem.removeEventListener("click", changeProductColor);
  listItem.querySelector("button").removeEventListener("click", removeProductFromProductList);

  delete listCollection[listName][listItem.dataset.productName];
};

const deleteProductFromProductCollection = (listItem) => {
  listItem.removeEventListener("click", toggleProductCheckbox);
  listItem.querySelector("input").removeEventListener("change", updateControlAndActionBtns);
  listItem.querySelector("button").removeEventListener("click", removeProductFromProductList);

  delete productCollection[listItem.dataset.productName];
};

// ** Functions for action-button (cog-icon) **
const toggleActionList = () => {
  control.actionList.hidden = !control.actionList.hidden;

  if (control.actionList.hidden) {
    document.removeEventListener("click", toggleActionList);
  }
};

// ** Functions for show-button **
const showProductCollection = () => {
  product.list.replaceChildren(
    ...Object.values(productCollection).sort((a, b) => a.dataset.currentIndex - b.dataset.currentIndex)
  );
  product.list.classList.remove("formed-list");
  control.showBtn.classList.add("disabled");
  action.resetColorsBtn.firstElementChild.classList.add("disabled");
  updateControlAndActionBtns();
  currentListName = null;

  if (product.list.children.length !== 0) {
    control.checkBtn.classList.remove("disabled");
  }

  if (product.list.children.length > 1) {
    control.sortBtn.classList.remove("disabled");
  } else {
    control.sortBtn.classList.add("disabled");
  }

  selectCollection.forEach((listItem) => {
    listItem.classList.remove("selected-list");
  });
};

// ** Functions for form-button **
const hideModal = () => {
  modal.textInput.value = "";
  modal.formContainer.hidden = true;
  document.removeEventListener("click", hideModal);
};

// ** Functions for modal **
const addListToSelectCollection = (listName = currentListName) => {
  const listItem = document.createElement("li");
  listItem.dataset.listName = listName;
  listItem.innerHTML = `
    <span>${listName}</span>
    <button>✖</button>
  `;

  listItem.addEventListener("click", makeSelectedListCurrent);
  listItem.querySelector("button").addEventListener("click", removeListFromSelectListAndCollection);

  selectCollection.push(listItem);
  control.selectBtn.classList.remove("disabled");

  selectCollection.forEach((listItem) => {
    listItem.classList.remove("selected-list");
  });
  listItem.classList.add("selected-list");
};

const showListCollection = (listName = currentListName) => {
  product.list.replaceChildren(
    ...Object.values(listCollection[listName]).sort((a, b) => a.dataset.currentIndex - b.dataset.currentIndex)
  );
  product.list.classList.add("formed-list");
  control.checkBtn.classList.add("disabled");
  control.showBtn.classList.remove("disabled");
  control.formBtn.classList.add("disabled");
  action.deleteSelectedBtn.firstElementChild.classList.add("disabled");
  updateActionResetBtn();

  if (product.list.children.length > 1) {
    control.sortBtn.classList.remove("disabled");
  } else {
    control.sortBtn.classList.add("disabled");
  }
};

// ** Functions for select-button **
const toggleSelectList = () => {
  control.selectList.hidden = !control.selectList.hidden;

  if (control.selectList.hidden) {
    document.removeEventListener("click", toggleSelectList);
  }
};

// ** Functions for list (list-item) in control.selectList **
const makeSelectedListCurrent = (e) => {
  const listItem = e.currentTarget;
  currentListName = listItem.dataset.listName;

  showListCollection();

  selectCollection.forEach((listItem) => {
    listItem.classList.remove("selected-list");
  });
  listItem.classList.add("selected-list");
};

const removeListFromSelectListAndCollection = (e) => {
  const listItem = e.target.closest("li");

  listItem.remove();

  if (listItem.dataset.listName === currentListName) {
    showProductCollection();
  }

  listItem.removeEventListener("click", makeSelectedListCurrent);
  e.target.removeEventListener("click", removeListFromSelectListAndCollection);

  selectCollection.splice(selectCollection.indexOf(listItem), 1);
  deleteListFromListCollection(listItem.dataset.listName);

  if (selectCollection.length) e.stopPropagation();
  else control.selectBtn.classList.add("disabled");

  updateActionSaveBtn();
};

const deleteListFromListCollection = (listName) => {
  Object.values(listCollection[listName]).forEach((listItem) => {
    deleteProductFromListCollection(listItem, listName);
  });

  delete listCollection[listName];
};

// ** Listeners **
// When the app loaded
window.addEventListener("load", () => {
  if (!localStorage.getItem("shopping-list-data")) return;

  const shoppingListData = JSON.parse(localStorage.getItem("shopping-list-data"));

  shoppingListData.productCollection.forEach((productProps) => {
    addProductToProductCollection(productProps);
  });

  Object.entries(shoppingListData.listCollection).forEach(([listName, listArray]) => {
    listCollection[listName] = {};
    addListToSelectCollection(listName);

    listArray.forEach((productProps) => {
      addProductToListCollection(productProps);
    });
  });

  currentListName = shoppingListData.currentListName;
  if (currentListName) {
    showListCollection();
  } else {
    showProductCollection();
  }

  if (
    Object.values(productCollection).length !== 0 &&
    Object.values(productCollection).every((listItem) => listItem.querySelector("input").checked)
  ) {
    control.checkbox.checked = true;
    control.checkTooltip.innerHTML = "Remove<br>all";
  } else {
    control.checkbox.checked = false;
    control.checkTooltip.innerHTML = "Select<br>all";
  }

  action.deleteFromDiskBtn.firstElementChild.classList.remove("disabled");
});

// Pressing x-button in product.textInput
product.form.addEventListener("reset", () => product.textInput.focus());

// Pressing add-button
product.form.addEventListener("submit", (e) => {
  e.preventDefault();

  const productName =
    product.textInput.value.trim()[0].toUpperCase() + product.textInput.value.trim().toLowerCase().slice(1);

  if (isFormedListActive()) {
    if (Object.hasOwn(listCollection[currentListName], productName)) {
      showPopup(product.alertPopup, 0);
      return;
    }

    addProductToListCollection({ productName });
    showProductFromListCollection(productName);
  } else {
    if (Object.hasOwn(productCollection, productName)) {
      showPopup(product.alertPopup, 0);
      return;
    }

    addProductToProductCollection({ productName });
    showProductFromProductCollection(productName);
  }

  product.textInput.value = "";
});

// Pressing check-button in control-panel
control.checkBtn.addEventListener("click", (e) => {
  control.checkbox.click();
});

// Changing checkbox in control-panel
control.checkbox.addEventListener("change", (e) => {
  if (control.checkbox.checked) {
    product.list.querySelectorAll('input[type="checkbox"]').forEach((elem) => (elem.checked = true));
    control.checkTooltip.innerHTML = "Remove<br>all";
    control.formBtn.classList.remove("disabled");
    action.deleteSelectedBtn.firstElementChild.classList.remove("disabled");
  } else {
    product.list.querySelectorAll('input[type="checkbox"]').forEach((elem) => (elem.checked = false));
    control.checkTooltip.innerHTML = "Select<br>all";
    control.formBtn.classList.add("disabled");
    action.deleteSelectedBtn.firstElementChild.classList.add("disabled");
  }
});

// Pressing action-button (cog-icon)
control.actionBtn.addEventListener("click", (e) => {
  e.stopPropagation();

  if (control.actionList.hidden) {
    document.addEventListener("click", toggleActionList);
  }

  toggleActionList();
});

// Pressing delete-selected-button in control.actionList
action.deleteSelectedBtn.addEventListener("click", (e) => {
  if (action.deleteSelectedBtn.firstElementChild.classList.contains("disabled")) {
    e.stopPropagation();
    return;
  }

  product.list.querySelectorAll("li:has(input:checked)").forEach((listItem) => {
    removeProductFromProductList({ target: listItem });
  });

  updateActionSaveBtn();
});

// Pressing reset-colors-button in control.actionList
action.resetColorsBtn.addEventListener("click", (e) => {
  if (action.resetColorsBtn.firstElementChild.classList.contains("disabled")) {
    e.stopPropagation();
    return;
  }

  Array.from(product.list.children).forEach((listItem) => {
    listItem.classList.remove("selected-product");
  });

  updateActionResetBtn();
});

// Pressing save-to-disk-button in control.actionList
action.saveToDiskBtn.addEventListener("click", (e) => {
  if (action.saveToDiskBtn.firstElementChild.classList.contains("disabled")) {
    e.stopPropagation();
    return;
  }

  const shoppingListData = {
    productCollection: [],
    listCollection: {},
  };

  Object.values(productCollection).forEach((listItem) => {
    shoppingListData.productCollection.push({
      productName: listItem.dataset.productName,
      defaultIndex: listItem.dataset.defaultIndex,
      currentIndex: listItem.dataset.currentIndex,
      checked: listItem.querySelector("input").checked,
    });
  });
  Object.entries(listCollection).forEach(([listName, list]) => {
    shoppingListData.listCollection[listName] = [];
    Object.values(list).forEach((listItem) => {
      shoppingListData.listCollection[listName].push({
        productName: listItem.dataset.productName,
        defaultIndex: listItem.dataset.defaultIndex,
        currentIndex: listItem.dataset.currentIndex,
        selected: listItem.classList.contains("selected-product"),
        listName: listName,
      });
    });
  });
  shoppingListData.currentListName = currentListName;

  localStorage.setItem("shopping-list-data", JSON.stringify(shoppingListData));

  action.deleteFromDiskBtn.firstElementChild.classList.remove("disabled");
});

// Pressing delete-from-disk-button in control.actionList
action.deleteFromDiskBtn.addEventListener("click", (e) => {
  if (action.deleteFromDiskBtn.firstElementChild.classList.contains("disabled")) {
    e.stopPropagation();
    return;
  }

  modal.confirmContainer.hidden = false;
});

// Pressing yes-button in modal
modal.yesBtn.addEventListener("click", () => {
  localStorage.clear();

  action.deleteFromDiskBtn.firstElementChild.classList.add("disabled");

  modal.confirmContainer.hidden = true;
});

// Pressing no-button in modal
modal.noBtn.addEventListener("click", () => {
  modal.confirmContainer.hidden = true;
});

// Pressing sort-button
control.sortBtn.addEventListener("click", () => {
  sortIndex++;
  if (isFormedListActive() && product.list.querySelector("li.selected-product")) {
    if (sortIndex === 2) sortIndex = 3;
    if (sortIndex > 5) sortIndex = 0;
  } else {
    if (sortIndex > 2) sortIndex = 0;
  }
  let sortedArray;

  switch (sortIndex) {
    case 0: // A-Z
      sortedArray = Array.from(product.list.children).sort((a, b) =>
        a.dataset.productName.localeCompare(b.dataset.productName)
      );
      control.sortInfoPopup.textContent = "A-Z";
      break;
    case 1: // Z-A
      sortedArray = Array.from(product.list.children).sort((a, b) =>
        b.dataset.productName.localeCompare(a.dataset.productName)
      );
      control.sortInfoPopup.textContent = "Z-A";
      break;
    case 3: // green up
      sortedArray = Array.of(
        ...product.list.querySelectorAll("li.selected-product"),
        ...product.list.querySelectorAll("li:not(.selected-product)")
      );
      control.sortInfoPopup.innerHTML = "green<br>up";
      break;
    case 4: // green down
      sortedArray = Array.of(
        ...product.list.querySelectorAll("li:not(.selected-product)"),
        ...product.list.querySelectorAll("li.selected-product")
      );
      control.sortInfoPopup.innerHTML = "green<br>down";
      break;
    default: // default
      sortedArray = Array.from(product.list.children).sort((a, b) => a.dataset.defaultIndex - b.dataset.defaultIndex);
      control.sortInfoPopup.textContent = "default";
  }

  showPopup(control.sortInfoPopup, 2, 1200, 100);

  sortedArray.forEach((elem, index) => (elem.dataset.currentIndex = index));

  product.list.replaceChildren(...sortedArray);
});

// Pressing show-button
control.showBtn.addEventListener("click", showProductCollection);

// Pressing form-button
control.formBtn.addEventListener("click", (e) => {
  e.stopPropagation();

  modal.formContainer.hidden = false;
  document.addEventListener("click", hideModal);
});

// Pressing ok-button in modal
modal.form.addEventListener("submit", (e) => {
  e.preventDefault();

  const listName = modal.textInput.value.trim()[0].toUpperCase() + modal.textInput.value.trim().toLowerCase().slice(1);

  if (Object.hasOwn(listCollection, listName)) {
    showPopup(modal.alertPopup, 1);
    return;
  }

  listCollection[listName] = {};
  currentListName = listName;

  product.list.querySelectorAll("li:has(input:checked)").forEach((listItem) => {
    addProductToListCollection({ productName: listItem.dataset.productName });
  });

  addListToSelectCollection();
  showListCollection();

  hideModal();
});

// We don't want to hide modal-container when clicking on modal-form
modal.form.addEventListener("click", (e) => e.stopPropagation());

// Pressing cancel-button in modal
modal.cancelBtn.addEventListener("click", hideModal);

// Pressing select-button
control.selectBtn.addEventListener("click", (e) => {
  e.stopPropagation();

  if (control.selectList.hidden) {
    control.selectList.replaceChildren(...selectCollection);
    document.addEventListener("click", toggleSelectList);
  }

  toggleSelectList();
});
