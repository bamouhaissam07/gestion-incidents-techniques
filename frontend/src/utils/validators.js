/**
 * Fonctions de validation des formulaires
 */

// Validation email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validation mot de passe
export const isValidPassword = (password) => {
  // Au moins 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Validation nom/prénom
export const isValidName = (name) => {
  if (!name || name.trim().length < 2) return false;
  // Lettres, espaces, tirets, apostrophes
  const nameRegex = /^[a-zA-ZÀ-ÿ\s\-']+$/;
  return nameRegex.test(name.trim());
};

// Validation numéro de téléphone français
export const isValidPhone = (phone) => {
  if (!phone) return true; // Optionnel
  const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Validation formulaire de connexion
export const validateLoginForm = (data) => {
  const errors = {};
  
  if (!data.email) {
    errors.email = 'L\'email est requis';
  } else if (!isValidEmail(data.email)) {
    errors.email = 'L\'email n\'est pas valide';
  }
  
  if (!data.password) {
    errors.password = 'Le mot de passe est requis';
  } else if (data.password.length < 6) {
    errors.password = 'Le mot de passe doit contenir au moins 6 caractères';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Validation formulaire d'inscription
export const validateRegisterForm = (data) => {
  const errors = {};
  
  if (!data.nom) {
    errors.nom = 'Le nom est requis';
  } else if (!isValidName(data.nom)) {
    errors.nom = 'Le nom n\'est pas valide';
  }
  
  if (!data.prenom) {
    errors.prenom = 'Le prénom est requis';
  } else if (!isValidName(data.prenom)) {
    errors.prenom = 'Le prénom n\'est pas valide';
  }
  
  if (!data.email) {
    errors.email = 'L\'email est requis';
  } else if (!isValidEmail(data.email)) {
    errors.email = 'L\'email n\'est pas valide';
  }
  
  if (!data.mot_de_passe) {
    errors.mot_de_passe = 'Le mot de passe est requis';
  } else if (!isValidPassword(data.mot_de_passe)) {
    errors.mot_de_passe = 'Le mot de passe doit contenir au moins 8 caractères, 1 majuscule, 1 minuscule et 1 chiffre';
  }
  
  if (!data.confirmPassword) {
    errors.confirmPassword = 'La confirmation du mot de passe est requise';
  } else if (data.mot_de_passe !== data.confirmPassword) {
    errors.confirmPassword = 'Les mots de passe ne correspondent pas';
  }
  
  if (!data.type_personne) {
    errors.type_personne = 'Le type de compte est requis';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Validation formulaire de demande d'intervention
export const validateDemandeForm = (data) => {
  const errors = {};
  
  if (!data.titre) {
    errors.titre = 'Le titre est requis';
  } else if (data.titre.length < 5) {
    errors.titre = 'Le titre doit contenir au moins 5 caractères';
  }
  
  if (!data.description) {
    errors.description = 'La description est requise';
  } else if (data.description.length < 10) {
    errors.description = 'La description doit contenir au moins 10 caractères';
  }
  
  if (!data.urgence) {
    errors.urgence = 'Le niveau d\'urgence est requis';
  }
  
  if (!data.categorie) {
    errors.categorie = 'La catégorie est requise';
  }
  
  if (!data.id_materiel) {
    errors.id_materiel = 'Le matériel concerné est requis';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Validation formulaire d'intervention
export const validateInterventionForm = (data) => {
  const errors = {};
  
  if (!data.actions_prises) {
    errors.actions_prises = 'Les actions prises sont requises';
  } else if (data.actions_prises.length < 10) {
    errors.actions_prises = 'La description des actions doit contenir au moins 10 caractères';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Validation formulaire utilisateur
export const validateUserForm = (data, isEdit = false) => {
  const errors = {};
  
  if (!data.nom) {
    errors.nom = 'Le nom est requis';
  } else if (!isValidName(data.nom)) {
    errors.nom = 'Le nom n\'est pas valide';
  }
  
  if (!data.prenom) {
    errors.prenom = 'Le prénom est requis';
  } else if (!isValidName(data.prenom)) {
    errors.prenom = 'Le prénom n\'est pas valide';
  }
  
  if (!data.email) {
    errors.email = 'L\'email est requis';
  } else if (!isValidEmail(data.email)) {
    errors.email = 'L\'email n\'est pas valide';
  }
  
  // Validation du téléphone s'il est fourni
  if (data.telephone && !isValidPhone(data.telephone)) {
    errors.telephone = 'Le numéro de téléphone n\'est pas valide';
  }
  
  // Mot de passe requis seulement pour la création
  if (!isEdit && !data.mot_de_passe) {
    errors.mot_de_passe = 'Le mot de passe est requis';
  } else if (data.mot_de_passe && !isValidPassword(data.mot_de_passe)) {
    errors.mot_de_passe = 'Le mot de passe doit contenir au moins 8 caractères, 1 majuscule, 1 minuscule et 1 chiffre';
  }
  
  // Type personne requis seulement pour la création (pas pour l'édition du profil)
  if (!isEdit && !data.type_personne) {
    errors.type_personne = 'Le type d\'utilisateur est requis';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Validation formulaire matériel
export const validateMaterielForm = (data) => {
  const errors = {};
  
  if (!data.nom) {
    errors.nom = 'Le nom du matériel est requis';
  } else if (data.nom.length < 3) {
    errors.nom = 'Le nom doit contenir au moins 3 caractères';
  }
  
  if (!data.numero_serie) {
    errors.numero_serie = 'Le numéro de série est requis';
  }
  
  if (!data.emplacement) {
    errors.emplacement = 'L\'emplacement est requis';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Validation formulaire de profil (plus souple)
export const validateProfileForm = (data) => {
  const errors = {};
  
  if (!data.nom) {
    errors.nom = 'Le nom est requis';
  } else if (!isValidName(data.nom)) {
    errors.nom = 'Le nom n\'est pas valide';
  }
  
  if (!data.prenom) {
    errors.prenom = 'Le prénom est requis';
  } else if (!isValidName(data.prenom)) {
    errors.prenom = 'Le prénom n\'est pas valide';
  }
  
  if (!data.email) {
    errors.email = 'L\'email est requis';
  } else if (!isValidEmail(data.email)) {
    errors.email = 'L\'email n\'est pas valide';
  }
  
  // Validation du téléphone s'il est fourni
  if (data.telephone && !isValidPhone(data.telephone)) {
    errors.telephone = 'Le numéro de téléphone n\'est pas valide';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Validation champ requis générique
export const isRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} est requis`;
  }
  return null;
};

// Validation longueur minimale
export const minLength = (value, min, fieldName) => {
  if (value && value.length < min) {
    return `${fieldName} doit contenir au moins ${min} caractères`;
  }
  return null;
};

// Validation longueur maximale
export const maxLength = (value, max, fieldName) => {
  if (value && value.length > max) {
    return `${fieldName} ne peut pas dépasser ${max} caractères`;
  }
  return null;
};