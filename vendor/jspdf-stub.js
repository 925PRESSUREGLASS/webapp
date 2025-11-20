(function() {
  if (window.jspdf && window.jspdf.jsPDF) {
    return;
  }

  function JsPDF() {
    this.buffer = [];
  }

  var proto = JsPDF.prototype;
  proto.text = function() { return this; };
  proto.addImage = function() { return this; };
  proto.save = function() { return this; };
  proto.setFontSize = function() { return this; };
  proto.setFont = function() { return this; };
  proto.addPage = function() { return this; };
  proto.rect = function() { return this; };

  window.jspdf = {
    jsPDF: JsPDF
  };
})();
