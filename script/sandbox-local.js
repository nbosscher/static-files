var sandbox = (function(){
	/*
	* @Author: Nate Bosscher (c) 2015
	* @Date:   2016-09-05 11:09:53
	* @Last Modified by:   Nate Bosscher
	* @Last Modified time: 2016-09-05 11:21:01
	*/
	
	var objs = {}; // obj.name => object
	
	var register = function(name, object){
		objs[name] = object;
	};
	
	var getDependancy = function(name){
	    if(objs[name] == undefined){
	        var out = {};
	        for(var i in objs){
	            if(i.match(new RegExp(name + "\.[^\.]+$"))){
	                out[i.substring(i.lastIndexOf(".")+1)] = objs[i];
	            }
	        }
	
	        return out;
	    }
	
		return objs[name];
	};
	
	var getObject = function(){
		var out = {};
	
		for(var i in objs){
	
			var path = i.split(".");
			var pos = out;
			for(var j = 0; j < path.length; j++){
				if(j == path.length - 1){
					pos[path[j]] = objs[i];
				}else{
					if(!pos[path[j]])
						pos[path[j]] = {};
	
					pos = pos[path[j]];
				}
			}		
		}
	
		return out;
	};

	register('lib.Events', (function(){
		var module = {};
		
		
		
		var Events = function(){
		    var callbacks = {}; // name => [callback, callback...]
		
		    // returns removal function
		    this.$on = function(name, callback){
		        if(!callbacks[name])
		            callbacks[name] = [];
		
		        callbacks[name].push(callback);
		
		        return function(){
		            var i = callbacks.indexOf(callback);
		            if(i == -1) return;
		
		            callbacks.splice(i, 1);
		        };
		    };
		
		    this.$emit = function(name, arg){
		        if(!callbacks[name]){
		            console.log(name + " called but no one was listening");
		            return
		        }
		
		        for(var i in callbacks[name]){
		            callbacks[name][i](arg);
		        }
		    };
		}
		
		module.exports = Events;
		return module.exports;
	})() )
	
	register('lib.Promise', (function(lib_Events_uid_0){
		var module = {};
		
		var Events = lib_Events_uid_0;
		
		var Promise = function(){
		    this.serverError = function(callback){
		        this.$on(Promise.EV_SERVER_ERROR, callback);
		        return this;
		    };
		
		    this.networkError = function(callback){
		        this.$on(Promise.EV_NETWORK_ERROR, callback);
		        return this;
		    };
		
		    this.success = function(callback){
		        this.$on(Promise.EV_SUCCESS, callback);
		        return this;
		    };
		
		    Events.call(this);
		};
		
		Promise.EV_SERVER_ERROR = "server-error";
		Promise.EV_NETWORK_ERROR = "network-error";
		Promise.EV_SUCCESS = "success";
		
		Promise.prototype.constructor = Promise;
		
		module.exports = Promise;
		return module.exports;
	})(getDependancy('lib.Events')) )
	
	register('lib.Ajax', (function(lib_Promise_uid_0){
		var module = {};
		
		var Promise = lib_Promise_uid_0;
		
		var Ajax = function(ajax_opts){
		
		    var xhttp = new XMLHttpRequest();
		    var p = new Promise();
		    var waiting = true;
		
		    var t = setTimeout(function(){
		        p.$emit(Promise.EV_NETWORK_ERROR);
		        waiting = false;
		    }, 5 * 1000);
		
		    xhttp.onreadystatechange = function() {
		        var d = null;
		        try{
		            d = JSON.parse(xhttp.responseText)
		        }catch(e){
		            d = null;
		        }
		
		        var arg = { text: xhttp.responseText, data: d, status: xhttp.status };
		
		        if(!waiting){
		            console.error("Got result after 5 seconds. EV_NETWORK_ERROR was already triggered");
		            return;
		        }
		
		        if (xhttp.readyState == 4 && xhttp.status == 200) {
		            p.$emit(Promise.EV_SUCCESS, arg );
		            clearTimeout(t);
		        }else if (xhttp.readyState == 4){
		            p.$emit(Promise.EV_SERVER_ERROR, arg);
		            clearTimeout(t);
		        }
		    };
		
		    xhttp.open(ajax_opts.method, ajax_opts.url, true);
		
		    if(ajax_opts.data) {
		        var d;
		        if(ajax_opts.data.constructor != String) {
		            d = JSON.stringify(ajax_opts.data);
		        }else{
		            d = ajax_opts.data;
		        }
		
		        xhttp.send(d);
		    }else{
		        xhttp.send();
		    }
		
		    return p;
		};
		
		module.exports = Ajax;
		return module.exports;
	})(getDependancy('lib.Promise')) )
	
	register('api.AuthToken', (function(){
		var module = {};
		
		
		var AuthToken = function(valueOrObject){
		
		    this.isValid = function(){
		        return true;
		    }
		
		    if(valueOrObject.constructor == String){
		        this.value = valueOrObject;
		        this.created = new Date();
		        return;
		    }
		
		    this.value = valueOrObject.value;
		    this.created = valueOrObject.created;
		};
		
		module.exports = AuthToken;
		return module.exports;
	})() )
	
	register('api.AuthenticationToken', (function(){
		var module = {};
		
		
		
		var auth_token = null;
		
		/**
		 * Takes AuthToken
		 * returns bool isValid
		 */
		var set = function(new_auth_token){
		    if((new_auth_token instanceof AuthToken)){
		        auth_token = new_auth_token;
		        return true;
		    }
		
		    if((new_auth_token instanceof Object) && new_auth_token.value){
		        auth_token = new AuthToken(new_auth_token);
		        return auth_token.isValid()
		    }
		
		    throw new Error("constructor should be of type AuthToken or AuthToken literal");
		};
		
		module.exports = {
		    set: set
		}
		return module.exports;
	})() )
	
	register('util.Extends', (function(){
		var module = {};
		
		
		var ext = function(dstClass, srcClass){
		
		    for(var i in srcClass.prototype)
		        dstClass.prototype[i] = srcClass.prototype[i];
		
		};
		
		module.exports = ext;
		return module.exports;
	})() )
	
	register('util.ImplementsInterface', (function(){
		var module = {};
		
		
		var comparator = function(cTest, cSpec){
		
		    for(var i in cSpec.prototype){
		        if(!cTest.prototype[i] || cTest.prototype[i].constructor == cSpec.prototype[i].constructor){
		
		            throw cTest.name + " doesn't implement interface " + cSpec.name;
		        }
		    }
		
		};
		
		module.exports = comparator;
		return module.exports;
	})() )
	
	register('util.QueryArgs', (function(){
		var module = {};
		
		
		var QueryArgs = function(){
		
		    var ob = {};
		    var gen = false;
		
		    if(gen)
		        return ob;
		
		    if(window.location.search.length == 0)
		        return ob;
		
		    var str = window.location.search.substring(1);
		    var lst = str.split("&");
		
		    for(var i = 0; i < lst.length; i++){
		        var el = lst[i].split("=")
		        ob[el[0]] = decodeURIComponent(el[1]);
		    }
		
		    gen = true;
		
		    return ob;
		};
		
		module.exports = QueryArgs;
		return module.exports;
	})() )
	
	register('util.validate.MutuallyExclusive', (function(){
		var module = {};
		
		
		/**
		 * Used in validating object keys. Either object defines key A or B (xor)
		 *
		 * a => string
		 * b => string
		 *
		 */
		var MutuallyExclusive = function(a, b){
		
		    // convert function call to constructor call
		    if(this.constructor != MutuallyExclusive){
		        return new MutuallyExclusive(a,b);
		    }
		
		    if(a.constructor != window.String)
		        throw "MutuallyExclusive only takes strings (you should only have strings as your object keys...)";
		    if(b.constructor != window.String)
		        throw "MutuallyExclusive only takes strings (you should only have strings as your object keys...)";
		
		    this.a = a;
		    this.b = b;
		
		    this.toString = function(){
		        console.log("Mutual exclusion validation failed for keys " + this.a + ", " + this.b);
		    }
		
		    this.IsValid = function(test_value){
		        var a = test_value[this.a] == undefined;
		        var b = test_value[this.b] == undefined;
		
		        if(!a && !b || a && b){
		            console.log(this.toString());
		            return false;
		        }
		
		        return true;
		    };
		
		    this.ConvertDateStringsToDate = function(obj, key){
		        // doesn't apply to us, satisfies validate Interface
		    };
		}
		
		module.exports = MutuallyExclusive;
		return module.exports;
	})() )
	
	register('util.validate.Spec', (function(){
		var module = {};
		
		
		/**
		 * spec_definition = {
		 *  key => (class constructor|validate-property-validator)
		 * }
		 *
		 * validate-property-validator methods:
		 *      validate.optional
		 *      validate.oneOf
		 *      validate.string
		 *      validate.number
		 *      validate.date
		 *      validate.boolean
		 */
		var Spec = function(spec_definition){
		
		    // if called as a function convert to a
		    // constructor
		    if(this.constructor != Spec){
		        return new Spec(spec_definition);
		    }
		
		    Object.keys(spec_definition); // should throw if not an object
		    if(spec_definition.constructor == Array)
		        throw "Should be an object";
		
		    var spec = spec_definition;
		
		    this.IsValid = function(obj){
		
		        for(var i in obj){
		            if(spec[i] == undefined){
		                console.log("excess key " + i + " for object ", obj);
		                return false;
		            }
		
		            // user defined class
		            if(spec[i].IsValid == undefined){
		
		                // constructors match
		                if(obj[i].constructor == spec[i])
		                    continue;
		
		                if(spec[i].validator){
		                    // value is a valid spec for the class
		                    if(!spec[i].IsValid(obj[i])){
		                        console.log("object key " + i + " should be of type " + spec[i].constructor.name + " or valid constructor_spec for object ", obj);
		                        return false;
		                    }
		                }
		            }
		
		            if(!spec[i].IsValid(obj[i])){
		                console.log("object key " + i + " should be of type " + spec[i].toString() + " for object ", obj);
		
		                return false;
		            }
		        }
		
		        return true;
		    }
		
		    this.ConvertDateStringsToDate = function(obj){
		
		        for(var i in obj){
		            spec[i].ConvertDateStringsToDate(obj, i);
		        }
		    };
		};
		
		module.exports = Spec;
		return module.exports;
	})() )
	
	register('util.validate.Compose', (function(util_validate_MutuallyExclusive_uid_0, util_validate_Spec_uid_0){
		var module = {};
		
		// imports
		var MutuallyExclusive = util_validate_MutuallyExclusive_uid_0;
		var Spec = util_validate_Spec_uid_0;
		
		
		// exported class
		var Compose;
		
		/**
		 * compose_spec = [validate-compose-calls]
		 *
		 * validate-compose methods:
		 *      validate.mutuallyExclusive,
		 *      validate.spec
		 *
		 * e.g. var v = validate;
		 *          v.Compose([
		                v.Spec({
		                    "key": v.Optional()
		                })
		            ])
		 */
		Compose = function(compose_spec) {
		
		    // if called as a method, convert to constructor call
		    if(this.constructor != Compose){
		        return new Compose(compose_spec);
		    }
		
		    var validators = [];
		
		    if(!(compose_spec.constructor == Array))
		        throw "Compose should receive an array";
		
		    for(var i = 0; i < compose_spec.length; i++){
		        if(compose_spec[i].constructor == MutuallyExclusive || compose_spec[i].constructor == Spec){
		            validators.push(compose_spec[i]);
		            continue;
		        }
		
		        throw "Compose should receive an array of MutuallyExclusive or Spec";
		    }
		
		    this.IsValid = function(test_value){
		
		        for(var i = 0; i < validators.length; i++)
		            if(!validators[i].IsValid(test_value)){
		                return false;
		            }
		
		        return true;
		    };
		
		    this.ConvertDateStringsToDate = function(obj){
		
		        // assume obj is valid
		        for(var i = 0; i < validators.length; i++)
		            validators[i].ConvertDateStringsToDate(obj);
		    }
		};
		
		module.exports = Compose;
		return module.exports;
	})(getDependancy('util.validate.MutuallyExclusive'), getDependancy('util.validate.Spec')) )
	
	register('util.RegisterValidator', (function(util_validate_Compose_uid_0){
		var module = {};
		
		var Compose = util_validate_Compose_uid_0;
		
		var register = function(classConstructor, validator){
		    if(validator.constructor != Compose)
		        throw "validator must be of type util.validate.Compose";
		
		    if(!classConstructor.validators)
		        classConstructor.validators = [];
		
		    classConstructor.validators.push(validator);
		};
		
		module.exports = register;
		return module.exports;
	})(getDependancy('util.validate.Compose')) )
	
	register('util.validate.ValidatorInterface', (function(){
		var module = {};
		
		var validatorInterface = function(){
		
		    this.IsValid = function(test_value){
		        throw "not implemented"
		    }
		
		    this.ConvertDateStringsToDate = function(obj, key){
		        throw "not implemented"
		    }
		};
		
		module.exports = validatorInterface;
		return module.exports;
	})() )
	
	register('util.validate.Boolean', (function(util_validate_ValidatorInterface_uid_0, util_uid_0){
		var module = {};
		
		// imports
		var ValidatorInterface = util_validate_ValidatorInterface_uid_0;
		var util = util_uid_0;
		
		// exported class
		var booleanClass = function(){};
		
		// class inheritance
		util.ImplementsInterface(booleanClass, ValidatorInterface)
		
		// class definition
		booleanClass.prototype.constructor = function(){
		
		   // for debug purposes
		   this.toString = function(){
		       return "Boolean";
		   }
		
		   this.IsValid = function(test_value){
		
		       if(test_value === null || test_value === undefined)
		           return false;
		
		       if(test_value === true || test_value === false){
		           return true;
		       }else{
		           return false;
		       }
		   };
		
		   this.ConvertDateStringsToDate = function(obj, key){
		       // doesn't apply to us, satisfies validate Interface
		   };
		};
		
		var BooleanSingleton = new (booleanClass)();
		module.exports = BooleanSingleton;
		return module.exports;
	})(getDependancy('util.validate.ValidatorInterface'), getDependancy('util')) )
	
	register('util.validate.Date', (function(util_validate_ValidatorInterface_uid_0, util_uid_0){
		var module = {};
		
		// checks if the input is a Date object or date string
		
		// imports
		var ValidatorInterface = util_validate_ValidatorInterface_uid_0;
		var util = util_uid_0;
		
		// exported class
		var DateClass = function(){};
		
		// inheritance
		util.ImplementsInterface(DateClass, ValidatorInterface);
		
		// class definition
		DateClass.prototype = function(){
		
		    // for debug purposes
		    this.toString = function(){
		        return "Date";
		    }
		
		    this.IsValid = function(test_value){
		
		        if(test_value === null || test_value === undefined)
		            return false;
		
		        // use window.Date reference to ensure actual date constructor, not this class
		        if(test_value.constructor == window.Date){
		            return true;
		        }
		
		        // valid date string
		        if(!isNaN(window.Date.parse(test_value))){
		            return true;
		        }
		
		        return false;
		    };
		
		    this.ConvertDateStringsToDate = function(obj, key){
		        if(obj[key].constructor == window.Date)
		            return;
		
		        obj[key] = new window.Date(obj[key]);
		    };
		};
		
		var DateSingleton = new (DateClass)();
		module.exports = DateSingleton;
		return module.exports;
	})(getDependancy('util.validate.ValidatorInterface'), getDependancy('util')) )
	
	register('util.validate.Number', (function(util_validate_ValidatorInterface_uid_0, util_uid_0){
		var module = {};
		
		var ValidatorInterface = util_validate_ValidatorInterface_uid_0;
		var util = util_uid_0;
		
		// exported class
		var numberClass = function(){};
		
		// class inheritance
		util.ImplementsInterface(numberClass, ValidatorInterface);
		
		// class constructor
		numberClass.prototype.constructor = function(){
		
		    // for debug purposes
		    this.toString = function(){
		        return "Number";
		    }
		
		    this.IsValid = function(test_value){
		        if(test_value === null || test_value === undefined)
		            return false;
		
		        if(!isNaN(test_value) && isFinite(test_value)){
		            return true;
		        }else{
		            return false;
		        }
		    };
		
		    this.ConvertDateStringsToDate = function(obj, key){
		        // doesn't apply to us, satisfies validate Interface
		    };
		};
		
		var numberSingleton = new (numberClass)();
		module.exports = numberSingleton;
		return module.exports;
	})(getDependancy('util.validate.ValidatorInterface'), getDependancy('util')) )
	
	register('util.validate.OneOf', (function(util_validate_ValidatorInterface_uid_0, util_uid_0){
		var module = {};
		
		var ValidatorInterface = util_validate_ValidatorInterface_uid_0;
		var util = util_uid_0;
		
		var classOneOf = function(){};
		
		util.ImplementsInterface(classOneOf, ValidatorInterface);
		
		/**
		 * array_of_one_spec = [value] (e.g. ["motor-boat", "tug-boat"])
		 *
		 * test values are compared using the == operator
		 */
		classOneOf.prototype.constructor = function(array_of_one_spec){
		
		   // convert function call to constructor call
		   if(this.constructor != OneOf)
		       return new OneOf(array_of_one_spec);
		
		   if(array_of_one_spec.constructor != window.Array){
		       throw "OneOf should receive an array";
		   }
		
		   var v = array_of_one_spec;
		
		   this.toString = function(){
		       return "oneOf [ " + v.join(", ") + " ]";
		   };
		
		   this.IsValid = function(test_value){
		       for(var i = 0; i < v.length; i++){
		           if(v[i] == test_value)
		               return true;
		       }
		
		       return false;
		   };
		
		
		   this.ConvertDateStringsToDate = function(obj, key){
		       // doesn't apply to us, satisfies validate Interface
		   };
		}
		
		
		module.exports = classOneOf;
		return module.exports;
	})(getDependancy('util.validate.ValidatorInterface'), getDependancy('util')) )
	
	register('util.validate.Optional', (function(util_validate_ValidatorInterface_uid_0, util_uid_0){
		var module = {};
		
		// imports
		var ValidatorInterface = util_validate_ValidatorInterface_uid_0;
		var util = util_uid_0;
		
		// exported class
		var Optional = function(){};
		
		// class inheritance
		util.ImplementsInterface(Optional, ValidatorInterface);
		
		// class definition
		Optional.prototype.constructor = function(value){
		
		    // convert function call to constructor call
		    if(this.constructor != Optional)
		        return new Optional(value);
		
		    this.toString = function(){
		        return " optional: " + value;
		    }
		
		    this.IsValid = function(test_value){
		        if(test_value == undefined || test_value == null){
		            return true;
		        }
		
		        // is nested validate method (e.g. validate.Optional(validate.Date()) )
		        if(value.IsValid){
		            return value.IsValid(test_value);
		        }
		
		        // plain value
		        return test_value == value;
		    }
		
		    this.ConvertDateStringsToDate = function(obj, key){
		        if(obj[key] == undefined || obj[key] == null)
		            return
		
		        value.ConvertDateStringsToDate(obj, key);
		    };
		}
		
		module.exports = Optional;
		return module.exports;
	})(getDependancy('util.validate.ValidatorInterface'), getDependancy('util')) )
	
	register('util.validate.String', (function(util_validate_ValidatorInterface_uid_0, util_uid_0){
		var module = {};
		
		// imports
		var ValidatorInterface = util_validate_ValidatorInterface_uid_0;
		var util = util_uid_0;
		
		// exported class
		var String = function(){}
		
		// class inheritance
		util.ImplementsInterface(String, ValidatorInterface);
		
		// class definition
		String.prototype.constructor = function(){
		
		    // for debug purposes
		    this.toString = function(){
		        return "String";
		    }
		
		    this.IsValid = function(test_value){
		        if(test_value === null || test_value === undefined)
		            return false;
		
		        // use window.String reference to ensure actual string constructor, not this class
		        if(test_value.constructor == window.String){
		            return true;
		        }else{
		            return false;
		        }
		    };
		
		    this.ConvertDateStringsToDate = function(obj, key){
		        // doesn't apply to us, satisfies validate Interface
		    };
		}
		
		var StringSingleton = new String();
		module.exports = StringSingleton;
		
		
		return module.exports;
	})(getDependancy('util.validate.ValidatorInterface'), getDependancy('util')) )
	
	register('api.Child', (function(util_validate_uid_0, util_uid_0){
		var module = {};
		
		var v = util_validate_uid_0;
		var util = util_uid_0;
		
		// Local Statics
		var SPEC_BLANK = 1;
		var SPEC_BASIC_CHILD = 2;
		
		var children = {}; // list of children created with a non-undefined spec
		                   // childID => Child
		
		// Exported class
		var childClass = function(){};
		
		/**
		 * Validators
		 */
		var basic_child_validator = v.Compose([
		   v.Spec({
		       "ChildID": v.Number,
		       "FirstName": v.String,
		       "LastName": v.String,
		   })
		]);
		
		util.RegisterValidator(childClass, basic_child_validator);
		
		/**
		 * Constructor:
		 * child_spec = undefined or basic_child_spec
		 *
		 * basic_child_spec = { // see basic_child_validator assignment below. }
		 */
		childClass.prototype.constructor = function(child_spec){
		
		    // locals
		    var spec_type = SPEC_BLANK;
		    var enrollments = [];
		    var self = this;
		    var child = {};
		
		    // constructor
		    (function(){
		        if(child_spec == undefined)
		            return;
		
		        if(basic_child_validator.IsValid(child_spec)){
		            spec_type = SPEC_BASIC_CHILD;
		            child = child_spec;
		
		            children[child.ChildID] = self;
		            return;
		        }
		
		        throw "Invalid child_spec. can be undefined or basic_child_spec";
		    })();
		
		    // methods
		    this.GetID = function(){
		        return child.ChildID;
		    };
		
		    this.SetEnrollments = function(array_of_enrollment_spec_or_enrollment){
		        var a = array_of_enrollment_spec_or_enrollment; // readablility
		
		        if(a.constructor != Array){
		            throw "expected array of enrollment_spec or Enrollment objects";
		        }
		
		        enrollments = [];
		
		        for(var i = 0; i < a.length; i++){
		            if(a.constructor == sandbox.api.Enrollment){
		                enrollments.push(a[i]);
		            }else{
		                enrollments.push(new sandbox.api.Enrollment(a[i]));
		            }
		        }
		    };
		
		    this.GetEnrollments = function(){
		        return enrollments;
		    };
		};
		
		
		// static methods
		
		
		/**
		 * Gets a list of children declared with a defined ChildID
		 * since script start.
		 *
		 * return [Child]
		 */
		childClass.GetLoadedChildren = function(){
		    var l = [];
		    for(var i in children)
		        l.push(children[i]);
		
		    return l;
		};
		
		module.exports = childClass;
		return module.exports;
	})(getDependancy('util.validate'), getDependancy('util')) )
	
	register('api.Const', (function(){
		var module = {};
		
		
		var Const = null; // no export
		
		//var API_DOMAIN = "//api2.runsandbox.com";
		var port = "8080";
		var protocol = "false" ? "https://" : "http://";
		
		var API_DOMAIN = protocol + "api.sandboxlocal.com" + (port != 80 ? ":" + port : "");
		
		module.exports = {
		    API_DOMAIN: API_DOMAIN,
		};
		return module.exports;
	})() )
	
	register('api.ErrorTracking', (function(lib_Events_uid_0, util_uid_0){
		var module = {};
		
		var Events = lib_Events_uid_0;
		var util = util_uid_0;
		
		var ErrorTracking = function(){};
		
		// inheritance
		util.Extends(ErrorTracking, Events);
		
		ErrorTracking.prototype.constructor = function(){
		
		    // local vars
		    var data = [];
		
		    // methods
		    this.init = function(initData){
		
		        if((initData.constructor == String) && initData.length > 0){
		            var dt = JSON.parse(initData);
		            for(var i = dt.length - 1; i >= 0; i--)
		                data.push(new El(dt[i]))
		        }
		    }
		
		    this.getData = function(){
		        data.sort(function(a, b){
		            return a.Created.getTime() - b.Created.getTime();
		        });
		
		        return data;
		    }
		};
		
		// error tracking element
		function El(dt){
		    this.ID = dt.ID;
		    this.Created = new Date(dt.Created);
		    this.Hash = dt.Hash;
		    this.ServerInfo = dt.ServerInfo;
		    this.ClientInfo = dt.ClientInfo;
		    this.ErrorType = dt.ErrorType;
		    this.Location = ErrorTracking.LOCATION_UNKNOWN;
		
		    this.Detail = "";
		
		    if(this.ClientInfo){
		        this.Location = this.ClientInfo.Location;
		        this.Name = this.ClientInfo.EventName + " " + this.ClientInfo.EventValue;
		        this.ClientInfo.ClientIDHash = parseInt(this.ClientInfo.ClientID, 10).toString(16);
		    }
		
		    if(this.ServerInfo){
		        if(this.ServerInfo.Request){
		            var self = this;
		
		            setTimeout(function(){
		                try{
		                    var req = JSON.parse(self.ServerInfo.Request);
		
		                    self.Location = req.URL;
		                    self.ServerInfo = {
		                        Referer: req.Referer,
		                        Method: req.Params.REQUEST_METHOD,
		                        Body: req.Params.Body,
		                        LoginEmail: req.Params.LOGON_USER,
		                        IP: req.Params.HTTP_X_FORWARDED_FOR,
		                        Misc: req.Params
		                    };
		
		                }catch(e){
		                    console.error(e);
		                }
		            });
		        }
		
		        this.Name = this.ServerInfo.ExceptionMessage;
		        this.StackTrace = this.ServerInfo.StackTrace;
		        this.UserMessage = this.ServerInfo.UserMessage;
		    }
		}
		
		// public statics
		ErrorTracking.EV_DATA = "error-tracking:data"
		ErrorTracking.EV_CONNECTION_ERROR = "error-tracking:connection-error"
		
		ErrorTracking.LOCATION_UNKNOWN = "Unknown"
		
		module.exports = ErrorTracking;
		
		return module.exports;
	})(getDependancy('lib.Events'), getDependancy('util')) )
	
	register('api.Enrollment', (function(util_validate_uid_0, util_uid_0){
		var module = {};
		
		var v = util_validate_uid_0;
		var util = util_uid_0;
		
		// Local Statics
		var enrollmentClass = {};
		
		// Exported class
		var enrollmentClass = function(){};
		
		/**
		 * Validators
		 */
		var enrollment_spec_validator = v.Compose([
		    v.Spec({
		        EnrollmentID: v.Number,
		        ChildID: v.Number,
		        ProgramID: v.Number,
		        ScheduleID: v.Number,
		        ClassID: v.Number,
		        EnrollmentStart: v.Optional(v.Date),
		        EnrollmentEnd: v.Optional(v.Date),
		        IsActive: v.Boolean,
		        Tuition: v.Optional(v.Number),
		        PriceUnitCd: v.Optional(v.String),
		        SessionID: v.Optional(v.Number),
		        SessionAdd: v.Boolean,
		        SessionEnd: v.Optional(v.Date),
		        WithdrawalReasonID: v.Optional(v.Number),
		        LastInvoiceDate: v.Optional(v.Date),
		        BillingScheduleID: v.Optional(v.Number),
		        FlexScheduleID: v.Optional(v.Number),
		        SchedulePriceID: v.Optional(v.Number),
		        IsFlexSchedule: v.Boolean,
		        OverrideProrateStart: v.Boolean,
		        ProrateStartFullAmount: v.Boolean,
		        ProrateStartAmount: v.Optional(v.Number),
		        ProrateStartPriceUnitCd: v.Optional(v.String),
		        OverrideProrateEnd: v.Boolean,
		        ProrateEndFullAmount: v.Boolean,
		        ProrateEndAmount: v.Optional(v.Number),
		        ProrateEndPriceUnitCd: v.Optional(v.String),
		        AttendanceBasedBilling: v.Boolean,
		        PreviousEnrollmentId: v.Optional(v.Number),
		        ApprovalPending: v.Boolean,
		        ChangeRequestGuardianId: v.Optional(v.Number),
		        ChangeRequestDate: v.Optional(v.Date),
		        ChangeRequestComments: v.Optional(v.String),
		        ChangeRequestEffectiveDate: v.Optional(v.Date),
		        ChangeRequestApprovedById: v.Optional(v.Number),
		        ChangeRequestApprovalDate: v.Optional(v.Date),
		        ChangeRequestRejectionDate: v.Optional(v.Date),
		        ChangeRequestStaffComments: v.Optional(v.String),
		        PricePerWeek: v.Boolean,
		        ChangeGuid: v.Optional(v.String),
		        EnrollmentEndReasonComments: v.Optional(v.String),
		        LateFeeID: v.Optional(v.Number),
		        EarlyFeeID: v.Optional(v.Number),
		    })
		]);
		
		util.RegisterValidator(enrollmentClass, enrollment_spec_validator);
		
		/**
		 * Inheritance
		 */
		// util.ExtendsClass(myClass, anotherClass);
		
		/**
		 * Constructor:
		 * enrollment_spec = {
		 *     // see validator.Spec call below
		 * }
		 */
		enrollmentClass.prototype.constructor = function(enrollment_spec){
		
		    // locals
		
		
		    // constructor
		    (function(){
		
		        throw "Invalid myclass_spec. documentation";
		    })();
		
		    if(!enrollmentClass.validator.IsValid(enrollment_spec)){
		        throw "Invalid enrollment_spec";
		    }
		
		    var obj = enrollment_spec;
		
		    validator.ConvertDateStringsToDate(enrollment_spec);
		
		
		
		    // methods
		
		    /**
		     * returns a clone of the enrollment object
		     */
		    this.AsObject = function(){
		        return JSON.parse(JSON.stringify(obj));
		    };
		
		    /**
		     * returns bool
		     * if the enrollment has ended
		     */
		    this.HasEnded = function(){
		        if(obj.EnrollmentEnd && obj.EnrollmentEnd.getTime() < new Date().getTime())
		            return true;
		
		        return false;
		    };
		};
		
		
		// static methods
		
		// none
		
		module.exports = enrollmentClass;
		return module.exports;
	})(getDependancy('util.validate'), getDependancy('util')) )
	
	register('api.Login', (function(util_validate_uid_0, lib_Ajax_uid_0, api_Const_uid_0, api_AuthenticationToken_uid_0, util_uid_0){
		var module = {};
		
		// imports
		var v = util_validate_uid_0;
		var ajax = lib_Ajax_uid_0;
		var cnst = api_Const_uid_0;
		var authentication_token = api_AuthenticationToken_uid_0;
		var util = util_uid_0;
		
		// exported class
		var Login = function(){};
		
		Login.SUCCESS = 1;
		Login.FAIL = 2;
		Login.NETWORK_ISSUE = 3;
		Login.USER_TYPE_USER = "user";
		Login.USER_TYPE_ADMIN = "admin";
		
		var login_spec_validator = v.Compose([
		    v.Spec({
		        "username": v.String,
		        "password": v.String,
		        "userType": v.OneOf([Login.USER_TYPE_USER, Login.USER_TYPE_ADMIN])
		    })
		]);
		util.RegisterValidator(Login, login_spec_validator);
		
		/**
		    login_spec = see above
		    http_callback = function(Login_Constant, auth_string)
		*/
		Login.prototype = function(login_spec, http_callback){
		
		    if(!login_spec_validator.IsValid(login_spec))
		        throw "Invalid login_spec";
		
		    var p = ajax({
		        method: "POST",
		        url: cnst.API_DOMAIN + "/v1/login",
		        data: {
		            username: login_spec.username.toString(),
		            password: login_spec.password.toString(),
		            userType: login_spec.userType
		        }
		    });
		
		    p.success(function(d){
		        if(d.data == null && d.text.length > 10){
		            var token = new AuthToken(d.text);
		            authentication_token.Set(token);
		
		            http_callback(Login.SUCCESS, token);
		        }else{
		            http_callback(Login.FAIL);
		        }
		    });
		
		    p.serverError(function(){
		        http_callback(Login.NETWORK_ISSUE);
		    });
		
		    p.networkError(function(){
		        http_callback(Login.NETWORK_ISSUE);
		    });
		};
		
		
		return module.exports;
	})(getDependancy('util.validate'), getDependancy('lib.Ajax'), getDependancy('api.Const'), getDependancy('api.AuthenticationToken'), getDependancy('util')) )
	
	register('api.UserPermissions', (function(){
		var module = {};
		
		
		return module.exports;
	})() )
	
	register('api.User', (function(util_validate_uid_0, api_UserPermissions_uid_0, util_uid_0){
		var module = {};
		
		// this is information about a Sandbox user
		
		var v = util_validate_uid_0;
		var UserPermissions = api_UserPermissions_uid_0;
		var util = util_uid_0;
		
		// local statics
		var USER_BLANK = 1;
		var USER_COMPLETE = 2;
		
		var userClass = function(){};
		
		basic_user_spec_validator = v.Compose([
		    v.Spec({
		        UserID: v.Number,
		        FirstName: v.String,
		        LastName: v.String,
		        Permissions: UserPermissions,
		    })
		]);
		
		util.RegisterValidator(userClass, basic_user_spec_validator);
		
		userClass.prototype.constructor = function(user_spec){
		
		    var state = USER_BLANK;
		    var obj; // private copy of user_spec
		
		    // constructor
		    (function(){
		        if(user_spec == undefined){
		            state = USER_BLANK;
		            obj = {};
		            return;
		        }
		
		        if(userClass.validator.IsValid(user_spec)){
		            state = USER_COMPLETE;
		            obj = user_spec;
		            return;
		        }
		
		        throw "invalid user_spec. must be undefined or user_spec_obj. please see validator definition for property requirements"
		    })();
		
		};
		
		module.exports = userClass;
		return module.exports;
	})(getDependancy('util.validate'), getDependancy('api.UserPermissions'), getDependancy('util')) )
	
	register('api.resetPassword.Finish', (function(){
		var module = {};
		
		/*
		 * finish_reset_password_spec = { password: "new password",
		 *      urlParams: "?a=b..."
		 *      (contents of window.location.search == see the golang auth package for exacly which parameters are used)
		 * callback = function(ResetPassword Constant)
		 */
		
		var Finish = function(finish_reset_password_spec, callback){
		    var spec = finish_reset_password_spec;
		
		    // validate
		    if(!(spec.urlParams && spec.password)){
		        throw new Error("Invalid finish_reset_password_spec");
		    }
		
		    var p = sandbox.lib.Ajax({
		        "url": API_DOMAIN + "/v1/forgot-password-complete" + spec.urlParams,
		        "method": "POST",
		        "data": spec.password
		    });
		
		    p.success(function(d){
		        if(d.text == "Ok"){
		            window.location = "/html/password-reset-success.html";
		        }else{
		            window.location = "/html/password-reset-fail.html";
		        }
		    });
		
		    p.serverError(function(){
		        window.location = "/html/password-reset-fail.html";
		    });
		
		    p.networkError(function(){
		        callback(Finish.NETWORK_FAIL);
		    });
		}
		
		Finish.NETWORK_FAIL = 1;
		return module.exports;
	})() )
	
	register('api.resetPassword.Start', (function(){
		var module = {};
		
		/**
		 * start_spec = {
		 *      username: "<string>",
		 *      returnUrl: "<string>",
		 * }
		 * http_callback = function(ForgotPasswordConstant){ }
		 */
		
		var Start = function(start_spec, http_callback){
		
		    var p = sandbox.lib.Ajax({
		        method: "POST",
		        url: API_DOMAIN + "/v1/forgot-password",
		        data: {
		            username: start_spec.username.toString(),
		            returnUrl: start_spec.returnUrl,
		        }
		    });
		
		    p.success(function(d){
		        if(d.data)
		            http_callback(Start.SUCCESS);
		        else
		            http_callback(Start.FAIL);
		    });
		
		    p.serverError(function(){
		        http_callback(Start.NETWORK_ISSUE);
		    });
		
		    p.networkError(function(){
		        http_callback(Start.NETWORK_ISSUE);
		    });
		};
		
		Start.SUCCESS = 1;
		Start.NETWORK_ISSUE = 2;
		Start.FAIL = 3;
		return module.exports;
	})() )

	return getObject()
})()