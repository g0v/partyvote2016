var app = angular.module('partyVote', ['rzModule', 'ui.bootstrap']);

app.controller('MainCtrl', function ($scope) {
  var totalSeats = 34;
  var parties = [
    {id: 'remain', name: '未分配比例'},
    {id: 'dpp', name: '民主進步黨'},
    {id: 'pfp', name: '親民黨'},
    {id: 'ftp', name: '自由台灣黨'},
    {id: 'ppu', name: '和平鴿聯盟黨'},
    {id: 'mcfap', name: '軍公教聯盟黨'},
    {id: 'mkt', name: '民國黨'},
    {id: 'fhl', name: '信心希望聯盟'},
    {id: 'chty', name: '中華統一促進黨'},
    {id: 'kmt', name: '中國國民黨'},
    {id: 'tsu', name: '台灣團結聯盟'},
    {id: 'npp', name: '時代力量'},
    {id: 'dasg', name: '大愛憲改聯盟'},
    {id: 'sdp', name: '綠黨社會民主黨聯盟'},
    {id: 'twip', name: '台灣獨立黨'},
    {id: 'npsu', name: '無黨團結聯盟'},
    {id: 'np', name: '新黨'},
    {id: 'nhsa', name: '健保免費連線'},
    {id: 'tp', name: '樹黨'}
  ];
  $scope.parties = {};


  function onChange() {
    var id = this.id;
    var party = $scope.parties[id];
    var total = 0.0;
    var advancedTotal = 0.0;
    parties.forEach(function(party) {
      if (party.id !== 'remain') {
        total += party.value;
      }
    });
    $scope.parties.remain.value = (100 - total).toFixed(1);

    if ($scope.parties.remain.value < 0) {
      party.value = parseFloat(party.value) + parseFloat($scope.parties.remain.value);
      $scope.parties.remain.value = 0;
    }

    parties.forEach(function(party) {
      party.win = parseFloat(party.value) >= 5;
      if (party.win) {
        advancedTotal += parseFloat(party.value);
      }
    });

    parties.forEach(function(party) {
      if (party.win) {
        party.advancedValue = parseFloat(party.value) * (100 / advancedTotal);
        party.seats = Math.round(totalSeats * (party.advancedValue / 100));
      }
      else {
        party.advancedValue = 0;
        party.seats = 0;
      }
    })

  }

  parties.forEach(function(party) {
    $scope.parties[party.id] = party;
    party.value = party.id === 'remain' ? 100 : 0;
    party.seats = party.id === 'remain' ? totalSeats : 0;
    party.advancedValue = party.id === 'remain' ? 100 : 0;
    party.options = {
      id: party.id,
      ceil: 100,
      precision: 1,
      step: 0.1,
      vertical: true,
      readOnly: party.id === 'remain',
      onChange: onChange,
      onEnd: onChange
    };
  });
});
