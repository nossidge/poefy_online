
// #############################################################################

// Cribbed from https://stackoverflow.com/a/8435261/139299
function weightedRand(spec) {
  let i, sum = 0, r = Math.random();
  for (i in spec) {
    sum += spec[i];
    if (r <= sum) return i;
  }
}

// Add ruby-like 'sample' and 'shuffle' array functions to jQuery.
// https://stackoverflow.com/a/11935263/139299
// https://stackoverflow.com/a/12646864/139299
(function($) {
  $.shuffle = function(arr) {
    if (!$.isArray(arr)) return null;
    let shuffled = arr.slice(0);
    for (let i = shuffled.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };
  $.sample = function(arr, size = 1) {
    if (!$.isArray(arr)) return null;
    let outArr = $.shuffle(arr).slice(0, size);
    return (size == 1) ? outArr[0] : outArr;
  };
})(jQuery);

// #############################################################################

// Display a new poem using the UI values.
function getPoem() {
  let corpus   = $("#dropdown_databases").val();
  let form     = $("#dropdown_poetic_forms").val();
  let rhyme    = $("#text_rhyme").val();
  let indent   = $("#text_indent").val();
  let syllable = $("#text_syllable").val();
  let regex    = $("#text_regex").val();
  let acrostic = $("#text_acrostic").val();

  // Create options object.
  let options = {};
  options.corpus = corpus;

  // If we aren't using the form, we are using the rhyme string.
  let usePoeticForm = $("#poetic_form").hasClass("active");
  if (usePoeticForm) {
    options.form = form;
  } else {
    options.rhyme = rhyme;

    // If invalid, flash the rhyme textbox to draw attention.
    if ( rhyme.trim() == "" || !parseRhymeString(rhyme).valid ) {
      $("#text_rhyme").fadeOut(100).fadeIn(100);
      return;
    }
  }

  // Add optional attributes.
  if (indent   != "") options.indent   = indent;
  if (syllable != "") options.syllable = syllable;
  if (regex    != "") options.regex    = regex;
  if (acrostic != "") options.acrostic = acrostic;

  // Get from the API and write response to the main div.
  getPoemFromAPI(options, function(text) {
    $("#poem_results").html(text);
  });
}

// Get the poem from the JSON request.
// 'options' is a hash that will be serialised to URL parameters.
// 'callback' is a function that does something with the HTML text.
function getPoemFromAPI(options, callback) {
  $.getJSON("poem?" + $.param(options), function(data) {
    let text = (data.length != 0)
      ? data.join("<br>").replace(/ /g, "&nbsp;")
      : "[A poem cannot be generated using the selected criteria]";
    callback(text);
  });
}

// #############################################################################

// Display the corpus description.
function selectDatabase(database) {
  setCorpus(database);
  getPoem();
}

// Toggle between named form and bespoke rhyme string.
function togglePoemType() {
  $("#poetic_form").toggleClass("active");
  $("#poetic_form_glyphicon").toggleClass("glyphicon-ok");
  $("#poetic_form_glyphicon").toggleClass("glyphicon-remove");
  $("#rhyme").toggleClass("active");
  $("#rhyme_glyphicon").toggleClass("glyphicon-ok");
  $("#rhyme_glyphicon").toggleClass("glyphicon-remove");
}
function setPoemTypePoeticForm() {
  if ( !$("#poetic_form").hasClass("active") ) togglePoemType();
}
function setPoemTypeRhyme() {
  if ( !$("#rhyme").hasClass("active") ) togglePoemType();
}

// Show help text for a specific poem option.
function helpText(helpTextID) {
  $("#poem_results").html(welcomeText);
  $("#poem_results pre").each( function(index, elem) {
    $(elem).html( $(elem).html().replace(/^\s+/mg, "") );
  });
  $("#" + helpTextID).toggleClass("hidden");
}

// Determine whether the rhyme string is valid.
// Directly taken from the 'poefy' Ruby gem.
function parseRhymeString(rhyme_string) {
  let tokens = [];
  let buffer = '';

  // Split string to tokens.
  $.each( rhyme_string.split(''), function(index, char) {
    if ( buffer != '' && (isNaN(Number(char)) || (char == ' ')) ) {
      tokens.push(buffer);
      buffer = '';
    }
    buffer += char;
  });
  tokens.push(buffer);

  // Handle invalid tokens.
  let boolean_array = $.map( tokens, function(char) {
    keep = char.replace(/[^A-Z,0-9]/g, "");
    return (keep == "" || !Number(keep));
  });

  // Not valid if there are any 'false' elements.
  let valid = boolean_array.reduce( function(sum, i) {
    return (sum && i);
  });

  // Get the rhyme letter for each token.
  let rhymes = $.map( tokens, function(char) {
    return char.toLowerCase().replace(/[^a-z ]/g, "");
  });

  // Find all lines that are not empty.
  let linesToRhymes = {};
  tokens.filter( function(elem, index) {
    if (elem.trim() != "") {
      linesToRhymes[index + 1] = elem;
    }
  });

  return {
    tokens: tokens,
    rhymes: rhymes,
    valid: valid,
    linesToRhymes: linesToRhymes
  };
}

// Highlight the rhyme textbox if it's invalid.
function highlightInvalidRhyme() {
  let rhymeString = $("#text_rhyme").val();
  let elem = $("#text_rhyme").parent();
  if (parseRhymeString(rhymeString).valid) {
    elem.removeClass("has-error");
  } else {
    elem.addClass("has-error");
  }
}

// #############################################################################

// Randomise option string based on the rhyme string.
function randomisePoemOption(textboxID) {
  let outputString, rhymeParsed, isValid = true;

  // No need to validate rhyme if it's the rhyme we are randomising.
  if (textboxID != "#text_rhyme") {

    // Get rhyme string from textbox or from poetic form.
    let rhymeString;
    let usePoeticForm = $("#poetic_form").hasClass("active");
    if (usePoeticForm) {
      let form = $("#dropdown_poetic_forms").val();
      rhymeString = poetic_forms[form].rhyme.slice(0);
    } else {
      rhymeString = $("#text_rhyme").val();
    }

    // Some poetic forms have multiple rhymes to choose from.
    // So if it's a single string, coerce to flattened array.
    let rhymeStrings = [].concat(...new Array(rhymeString));

    // Select a random rhyme from the array, and use that.
    rhymeString = $.sample(rhymeStrings);

    // Parse to tokens and rhymes.
    rhymeParsed = parseRhymeString(rhymeString);

    // Get a list of the unique rhymes.
    let uniques = [...new Set(rhymeParsed.rhymes)];

    // Don't do anything if the rhyme string is invalid or empty.
    let isEmpty = (uniques.length == 1 && uniques[0].trim() == "");
    isValid = rhymeParsed.valid && !isEmpty
  }

  // Randomise a particular option string.
  if (isValid) {
    switch(textboxID) {
      case "#text_rhyme":
        outputString = randomRhyme();
        setPoemTypeRhyme();
        break;
      case "#text_indent":
        outputString = randomIndentation(rhymeParsed);
        break;
      case "#text_syllable":
        outputString = randomSyllables(rhymeParsed);
        break;
      case "#text_regex":
        outputString = randomRegex(rhymeParsed);
        break;
    }

    // Write that back to the DOM and generate a new poem.
    $(textboxID).val(outputString);
    if (textboxID == "#text_rhyme") highlightInvalidRhyme();
    getPoem();
  }
}

// Randomise the rhyme string.
// We've already got a list of a bunch of nice rhyme strings.
// We can just use the ones specified in the named poetic forms.
function randomRhyme() {
  let rhymeStrings = [];
  $.each( poetic_forms, function(index, elem) {
    let toArr = [].concat(...new Array(elem.rhyme));
    $.each( toArr, function(i2, e2) { rhymeStrings.push(e2); });
  });
  return $.sample(rhymeStrings);
}

// Randomise the indentation.
// This approach is pretty naive, but it should be okay.
// Assign each unique rhyme a weighted, pseudo-random indentation.
// Then map it back to the rhyme array.
function randomIndentation(rhymeParsed) {
  let uniques = [...new Set(rhymeParsed.rhymes)];
  let weight = {0:0.5, 1:0.4, 2:0.1};
  let rhymeIndent = {};
  $.each( uniques, function(index, char) {
    let output = (char == " ") ? " " : weightedRand(weight);
    rhymeIndent[char] = output;
  });
  return $.map( rhymeParsed.rhymes, function(char) {
    return rhymeIndent[char];
  }).join("");
}

// Randomise the syllables.
// This is pretty rubbish, but at least it does something.
// Gives different results for even and odd line counts.
function randomSyllables(rhymeParsed) {
  let syllableString;

  // Even lines vs odd lines.
  // Only select if there are an even number of lines.
  let lineCount = Object.keys(rhymeParsed.linesToRhymes).length;
  if (lineCount % 2 == 0) {
    let line = 0, evenLineNos = [];
    $.each( rhymeParsed.linesToRhymes, function(key, value) {
      if (++line % 2 == 0) evenLineNos.push(key);
    });

    // Create the hash string.
    let weight = {6:0.3, 8:0.4, 10:0.3};
    let syllCountOdd  = weightedRand(weight);
    let syllCountEven = weightedRand(weight);
    if (syllCountOdd == syllCountEven) {
      syllableString = syllCountOdd;
    } else {
      syllableString = "{0:" + syllCountOdd;
      $.each( evenLineNos, function(index, lineNo) {
        syllableString += "," + lineNo + ":" + syllCountEven;
      });
      syllableString += "}";
    }

  // Use array of 1-3 elements.
  } else {
    let count = weightedRand( {1:0.5, 2:0.3, 3:0.2} );
    let weight = {6:0.3, 8:0.4, 10:0.3};
    let arr = [];
    for (let i = 0; i < count; i++) {
      arr.push( weightedRand(weight) );
    }

    // Dedupe and sort.
    arr = [...new Set(arr)].sort( function(a, b){return a-b} );

    // If only one value, then return the value.
    // If array, then delimit with commas.
    syllableString = (arr.length == 1) ? arr[0] : arr.join(",");
  }

  return syllableString;
}

// Randomise a regular expression.
// Just pick one at random from an array.
function randomRegex(rhymeParsed) {
  let regexes = [
    "^[A-Z]",
    "^[^eE]*$",
    "^The\ ",
    "!$",
    "{0=>/^[A-Z].*\?$/,-1=>/^[A-Z].*\.$/}"
  ];
  return $.sample(regexes);
}

// #############################################################################

// These form changes require more than just '.val(foo)'
function setCorpus(value) {
  $("#dropdown_databases").val(value);
  $("#database_desc").text(desc_databases[value]);
}
function setPoeticForm(value) {
  $("#dropdown_poetic_forms").val(value);
  setPoemTypePoeticForm();
}
function setRhymeScheme(value) {
  $("#text_rhyme").val(value);
  setPoemTypeRhyme();
}

// Clear a text box.
function clearInput(elem) {
  $(elem).val("");
}

// Clear all the option text boxes.
function clearInputs() {
  clearInput("#text_rhyme");
  clearInput("#text_indent");
  clearInput("#text_syllable");
  clearInput("#text_regex");
  clearInput("#text_acrostic");
}

// Read the actual text of the 'pre' tag to get the values.
// Write the values in the example to the option boxes.
// Generate a poem using the values.
function exampleClick(preTag) {
  let options = {}
  let lines = preTag.innerText.split("\n");
  let header = lines.slice(0, lines.indexOf("\xa0"));
  $.each( header, function(index, elem) {
    let value = elem.slice(15).trim();
    if (elem.startsWith("Corpus:")) {
      options.corpus = value;
    } else if (elem.startsWith("Poetic form:")) {
      options.form = value;
    } else if (elem.startsWith("Rhyme scheme:")) {
      options.rhyme = value;
    } else if (elem.startsWith("Indentation:")) {
      options.indent = value;
    } else if (elem.startsWith("Syllables:")) {
      options.syllable = value;
    } else if (elem.startsWith("Regex:")) {
      options.regex = value;
    } else if (elem.startsWith("Acrostic:")) {
      options.acrostic = value;
    }
  });

  // Update the form elements.
  clearInputs();
  if (options.corpus  ) setCorpus(options.corpus);
  if (options.form    ) setPoeticForm(options.form);
  if (options.rhyme   ) setRhymeScheme(options.rhyme);
  if (options.indent  ) $("#text_indent")  .val(options.indent);
  if (options.syllable) $("#text_syllable").val(options.syllable);
  if (options.regex   ) $("#text_regex")   .val(options.regex);
  if (options.acrostic) $("#text_acrostic").val(options.acrostic);

  // Request a poem and write it to the same <pre> tag.
  getPoemFromAPI(options, function(text) {
    $(preTag).html(header.join("\n") + "\n\xa0\n" + text);
  });
}

// #############################################################################

// Onload, select 'shakespeare' and 'sonnet'.
// Set up listeners for the toggle-able inputs.
$(document).ready( function() {
  welcomeText = $("#poem_results").html();
  $("#welcome_text").toggleClass("hidden");
  setCorpus("shakespeare");
  setPoeticForm("sonnet");
  $("#dropdown_poetic_forms").focus(setPoemTypePoeticForm);
  $("#text_rhyme").focus(setPoemTypeRhyme);
  $("#text_rhyme").change(highlightInvalidRhyme);
  $("#text_rhyme").keyup(highlightInvalidRhyme);
});

// #############################################################################
