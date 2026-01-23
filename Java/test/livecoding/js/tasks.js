// task 1
(function(a){
    return (function(){
      console.log(a);
      a = 23;
    })()
  })(45);
  
  
  // task 2
  var x = 23;
  
  (function(){
    var x = 43;
    (function random(){
      x++;
      console.log(x);
      var x = 21;
    })();
  })();
  
  
  // task 3
  function randomFunc(){
    
      
    for(let i = 0; i < 2; i++){
        await setTimeout(()=> console.log(i),1000);
    }
    
    }
  
  
  <btn onClick="changeBg()"/>
  
  function save() {
    btnId = document.getElementById("#btn")
  
      bg = 
  }
    
  await randomFunc();
  
  
  // task 4
    function func1(){
      var x;
      let y;
      
      setTimeout(()=>{
        console.log(x);
        console.log(y);
      },3000);
    
      x = 2;
      y = 12;
    }
    func1();
  
  //task 5
  const b = {
      name:"Viktor",
      f: function(){
        
        var self = this;
        console.log(this.name); 
        
        (function(){
          console.log(this.name); 
          console.log(self.name); 
        })();
      }
    }
  
  b.f();
  