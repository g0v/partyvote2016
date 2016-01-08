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
    {
      no: 1, id: 'dpp', name: '民主進步黨', enabled: true,
      candidates: ['吳焜裕', '吳玉琴', '陳曼麗', '顧立雄', '蔡培慧', '王榮璋',
      '谷辣斯·尤達卡（Kolas Yotaka）', '余宛如', '蘇嘉全', '段宜康', '鄭麗君',
      '陳其邁', '尤美女', '李應元', '鍾孔炤', '林靜儀', '徐國勇', '施義芳', '周春米',
      '李麗芬', '郭正亮', '邱泰源', '蔣絜安', '陳靜敏', '黃義佑', '余莓莓', '陳義聰',
      '江梅惠（Abu Kaaviana）', '謝世英', '曾美玲', '董建宏', '蔡宛芬', '黃帝穎',
      '王貴蓮']
    },
    {
      no: 2, id: 'pfp', name: '親民黨', enabled: true,
      candidates: ['李鴻鈞', '陳怡潔', '周陳秀霞', '黃越宏', '楊紫宗', '何偉真',
      '葉青', '胡祖慶', '鄭美蘭', '任睦杉', '劉冠霆', '董貞吟', '藍姿寬', '張克士',
      '黎淑慧', '李漢強']
    },
    {
      no: 3, id: 'ftp', name: '自由台灣黨',
      candidates: ['蕭曉玲', '郭正典', '周芷萱', '林世杰', '李淑慧', '蔡丁貴']
    },
    {
      no: 4, id: 'ppup', name: '和平鴿聯盟黨',
      candidates: ['吳宛甄', '鄭文松', '莊秉鴻']
    },
    {
      no: 5, id: 'mcfap', name: '軍公教聯盟黨',
      candidates: ['張賜', '陳金梅', '汪耀華', '陸炳成', '魏千妮']
    },
    {
      no: 6, id: 'mkt', name: '民國黨',
      candidates: ['陳漢洲', '林錫維', '陳奕樵', '蔡慧玲', '李天鐸', '何宇羚',
      '曾玉瓊', '蔡宥祥', '陳麗紋', '劉美貞']
    },
    {
      no: 7, id: 'fhl', name: '信心希望聯盟',
      candidates: ['董保城', '李莉娟', '黃迺毓', '陶君亮', '南岳君', '馮珮']
    },
    {
      no: 8, id: 'up', name: '中華統一促進黨',
      candidates: ['張安樂', '趙福芬', '莊永彰', '肖雲霞', '陳建華', '李淑華',
      '張孟崇', '陳韻如', '李宗奎', '康淑敏']
    },
    {
      no: 9, id: 'kmt', name: '中國國民黨', enabled: true,
      candidates: ['王金平', '柯志恩', '陳宜民', '林麗蟬', '許毓仁', '曾銘宗',
      '黃昭順', '吳志揚', '張麗善', '徐榛蔚', '曾永權', '王育敏', '胡築生', '林奕華',
      '童惠珍（僑）', '李貴敏', '徐巧芯', '陳玉梅', '侯佳齡', '李德維', '馬在勤',
      '連元章（僑）', '林倩綺', '邱素蘭', '王桂芸', '林信華', '楊建中', '郭淑娟',
      '鄭女勤', '李正皓', '曾瓊瑤', '林家興', '蕭敬嚴']
    },
    {
      no: 10, id: 'tsu', name: '台灣團結聯盟',
      candidates: ['陳奕齊', '顏綠芬', '賴振昌', '傅馨儀', '黃光藝', '李心儀',
      '高基讚', '張素華', '張兆林', '周倪安', '丁文祺', '林玉芳', '李卓翰', '張禾沂',
      '蔡青芳']
    },
    {
      no: 11, id: 'npp', name: '時代力量', enabled: true,
      candidates: ['高潞·以用·巴魕剌（Kawlo Iyun Pacidal）', '徐永明', '鄭秀玲',
      '柯劭臻', '林依瑩', '柯一正']
    },
    {
      no: 12, id: 'cct', name: '大愛憲改聯盟',
      candidates: ['黃千明', '吾爾開希·多萊特', '黃馨主', '張怡菁', '李宗勲', '洪美珍']
    },
    {
      no: 13, id: 'sdp', name: '綠黨與社民黨聯盟', enabled: true,
      candidates: ['張麗芬', '李根政', '詹順貴', '葉大華', '謝英俊', '許秀雯']
    },
    {
      no: 14, id: 'ti', name: '台灣獨立黨',
      candidates: ['田明達']
    },
    {
      no: 15, id: 'npsu', name: '無黨團結聯盟',
      candidates: ['林炳坤', '黃美蘭', '游旻慈', '鄭美珠', '蔡詠鍀', '蔡錦賢',
      '謝忠恆']
    },
    {
      no: 16, id: 'np', name: '新黨',
      candidates: ['葉毓蘭', '邱毅', '沈采穎', '唐慧琳', '陳麗玲', '王炳忠', '蘇恆',
      '侯漢廷', '趙家蓉', '楊世光']
    },
    {
      no: 17, id: 'nhsa', name: '健保免費連線',
      candidates: ['許榮淑', '林東雄', '黃嘉華']
    },
    {
      no: 18, id: 'tp', name: '樹黨',
      candidates: ['潘翰聲', '邱馨慧']
    }
  ];
  $scope.parties = {};
  $scope.showVideo = false;

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
