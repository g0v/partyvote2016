var app = angular.module('partyVote', ['rzModule', 'ui.bootstrap']);

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
  @return {Object()} List of {advancedValue, seats}
*/
function calculateSeats(totalSeat, partyValues) {
  // Apply rule 5 & rule 1
  //
  var sum = partyValues.reduce(function(s, p){
    return s + (p >= 5 ? p : 0)
  }, 0);

  var normalizedPercentage = partyValues.map(function(p){
    return p >= 5 ? +(p * 100 / sum).toFixed(4) : 0
  });

  // Apply rule 2
  //
  var flooredSeatSum = 0
  var parties = normalizedPercentage.map(function(p, idx){
    var seat = totalSeat * p / 100, flooredSeat = Math.floor(seat);

    flooredSeatSum += flooredSeat;

    return {
      id: idx, // parties will be sorted later, thus requires idx
      seat: flooredSeat,
      remain: seat - flooredSeat
    }
  })

  var result = normalizedPercentage.map(function(p, idx){
    return {
      advancedValue: p,
      seat: parties[idx].seat
    }
  });

  // Apply rule 3 (Ignore the 抽籤 part)
  //
  parties.sort(function(a, b){return b.remain-a.remain})
  while(flooredSeatSum < totalSeat) {
    var party = parties.shift();
    result[party.id].seat += 1;
    flooredSeatSum += 1;
  }

  return result;
}

app.controller('MainCtrl', function ($scope) {
  var totalSeats = 34;
  var parties = [
    {id: 'remain', name: '未分配比例'},
    {id: 'dpp', name: '民主進步黨'},
    {id: 'kmt', name: '中國國民黨'},
    {id: 'npp', name: '時代力量'},
    {id: 'sdp', name: '綠黨與社民黨聯盟'},
    {id: 'pfp', name: '親民黨'}
  ];
  $scope.parties = {};
  
  
  function onChange() {
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
      parties[idx].advancedValue = data.advancedValue
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
      vertical: true,
      readOnly: party.id === 'remain',
      onChange: onChange,
      onEnd: onChange
    };
  });
});
