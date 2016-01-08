var app = angular.module('partyVote', ['rzModule', 'ui.bootstrap', 'matchMedia']);

/**
  Rules - http://law.moj.gov.tw/LawClass/LawSingle.aspx?Pcode=D0020010&FLNO=67

  1)以各政黨得票數相加之和，除各該政黨得票數，求得各該政黨得票比率。
  2)以應選名額乘前款得票比率所得積數之整數，即為各政黨分配之當選名額；按政黨名單順位依序當選。
  3)依前款規定分配當選名額後，如有剩餘名額，應按各政黨分配當選名額後之剩餘數大小，依序分配剩餘名額。剩餘數相同時，以抽籤決定之。
  4)政黨登記之候選人名單人數少於應分配之當選名額時，視同缺額。
  5)各該政黨之得票比率未達百分之五以上者，不予分配當選名額；其得票數不列入第一款計算。
  6)第一款至第三款及前款小數點均算至小數點第四位，第五位以下四捨五入。

  @param {Number} totalSeat - total number of seats
  @param {Number[]} partyValues - list of raw percentage of each party
  @return {Object()} List of {value, seats}
*/
function calculateSeats(totalSeat, stage1votes) {
  // Apply rule 5 & rule 1
  //
  var stage1sum = stage1votes.reduce(function(s, p){
    return s + (p >= 5 ? p : 0)
  }, 0);

  var stage2votes = stage1votes.map(function(p){
    return p >= 5 ? +(p * 100 / stage1sum).toFixed(4) : 0
  });

  // Apply rule 2
  //
  var stage2totalSeat = 0
  var partiesData = stage2votes.map(function(p, idx){
    var seat = totalSeat * p / 100, flooredSeat = Math.floor(seat);

    stage2totalSeat += flooredSeat;

    return {
      id: idx, // partiesData will be sorted later, thus requires idx
      seat: flooredSeat,
      remain: seat - flooredSeat
    }
  })

  var result = stage2votes.map(function(p, idx){
    return {
      value: p,
      seat: partiesData[idx].seat
    }
  });

  // Apply rule 3 (Ignore the 抽籤 part)
  //
  partiesData.sort(function(a, b){return b.remain-a.remain})
  while(stage2totalSeat < totalSeat) {
    var partyData = partiesData.shift();
    result[partyData.id].seat += 1;
    stage2totalSeat += 1;
  }

  return result;
}

function updateSliderStyle(parties, vertical) {
  parties.forEach(function(party) {
    party.options.vertical = vertical;
  });
}

app.controller('MainCtrl', function ($scope, screenSize) {
  var totalSeats = 34;
  var parties = [
    {no: 0, id: 'remain', name: '未分配比例'},
    {no: 1, id: 'dpp', name: '民主進步黨', enabled: true},
    {no: 2, id: 'pfp', name: '親民黨', enabled: true},
    {no: 3, id: 'ftp', name: '自由台灣黨'},
    {no: 4, id: 'ppup', name: '和平鴿聯盟黨'},
    {no: 5, id: 'mcfap', name: '軍公教聯盟黨'},
    {no: 6, id: 'mkt', name: '民國黨'},
    {no: 7, id: 'fhl', name: '信心希望聯盟'},
    {no: 8, id: 'up', name: '中華統一促進黨'},
    {no: 9, id: 'kmt', name: '中國國民黨', enabled: true},
    {no: 10, id: 'tsu', name: '台灣團結聯盟'},
    {no: 11, id: 'npp', name: '時代力量', enabled: true},
    {no: 12, id: 'cct', name: '大愛憲改聯盟'},
    {no: 13, id: 'sdp', name: '綠黨與社民黨聯盟', enabled: true},
    {no: 14, id: 'ti', name: '台灣獨立黨'},
    {no: 15, id: 'npsu', name: '無黨團結聯盟'},
    {no: 16, id: 'np', name: '新黨'},
    {no: 17, id: 'nhsa', name: '健保免費連線'},
    {no: 18, id: 'tp', name: '樹黨'}
  ];
  $scope.parties = {};

  $scope.desktop = screenSize.is('md, lg');
  $scope.mobile = screenSize.is('xs, sm');

  // Using dynamic method `on`, which will set the variables initially and then update the variable on window resize
  screenSize.on('md, lg', function(match){
    $scope.desktop = match;
    updateSliderStyle(parties, $scope.desktop);
  });
  screenSize.on('xs, sm', function(match){
    $scope.mobile = match;
    updateSliderStyle(parties, $scope.desktop);
  });

  function update() {
    var id = this.id;
    var party = $scope.parties[id];
    var total = 0.0;
    parties.forEach(function(party) {
      if (party.id !== 'remain') {
        total += party.value;
      }
    });
    $scope.parties.remain.value = (100 - total).toFixed(4);

    if ($scope.parties.remain.value < 0) {
      party.value = parseFloat(party.value) + parseFloat($scope.parties.remain.value);
      $scope.parties.remain.value = 0;
    }

    var calculated = calculateSeats(totalSeats, parties.map(function(p){return parseFloat(p.value)}))
    calculated.forEach(function(data, idx){
      parties[idx].advancedValue = data.value
      parties[idx].seats = data.seat
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
      vertical: $scope.desktop,
      readOnly: party.id === 'remain',
      disabled: party.id === 'remain',
      onChange: update,
      onEnd: update
    };
  });

  $scope.toggle = function(party) {
    party.enabled = !party.enabled;
    party.value = 0;
    party.seats = 0;
    party.advancedValue = 0;
    update();
  }

  updateSliderStyle(parties, $scope.desktop);
});
