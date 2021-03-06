/*!
 * superbly tagfield v0.6
 * http://www.superbly.ch
 *
 * Copyright 2011, Manuel Spierenburg
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.superbly.ch/licenses/mit-license.txt
 * http://www.superbly.ch/licenses/gpl-2.0.txt
 *
 * Date: 27-11-2011
 */
(function($){
    $.fn.superblyTagField = function(userOptions) {
        var settings = {
        	caseSensitive:true,                //区分大小写
            allowNewTags:true,                 //允许新增
            allowedTagsNumber:false,           //允许标签的数量
            allowedTagsWordsNumber:false,      //允许每标签的长度
            showTagsNumber:10,                 //展示标签的数量
			addItemOnBlur:false,               //失去焦点时生成标签
            preset:[],
            tags:[],
            onRemove:function(tag) { return true; }
        };

        if(userOptions) {
            $.extend(settings, userOptions);
        }

        superblyTagField(this, settings);

        return this;
    };

    var keyMap = {
        downArrow:40,
        upArrow:38,
        enter:13,
        tab:9,
        backspace:8
    }
    function superblyTagField(tagField,settings) {

        var tags = settings.tags.sort();
        var preset = settings.preset;
        var caseSensitive = settings.caseSensitive;
        var allowNewTags = settings.allowNewTags;
        var allowedTagsNumber = settings.allowedTagsNumber;
        var showTagsNumber = settings.showTagsNumber;
		var addItemOnBlur = settings.addItemOnBlur;
        var onRemove = settings.onRemove;

        var tagstmp = tags.slice();

        // prepare needed vars
        var inserted = new Array();
        var selectedIndex = null;
        var currentValue = null;
        var currentItem = null;
        var hoverSuggestItems = false;

        tagField.css('display', 'none');

        var superblyMarkup = '<div class="superblyTagfieldDiv"><ul class="superblyTagItems"><li class="superblyTagInputItem"><input class="superblyTagInput" type="text" autocomplete="false"><ul class="superblySuggestItems"></ul></li></ul><div class="superblyTagfieldClearer"></div></div>';
        tagField.after(superblyMarkup);

        var tagInput = $(".superblyTagInput", tagField.next());
        var suggestList = tagInput.next();
        var inputItem = tagInput.parent();
        var tagList = inputItem.parent();

        // set presets
        for(i in preset){
            addItemWithFocus(preset[i],false);
        }

        // events
        suggestList.mouseover(function(e){
            hoverSuggestItems = true;
        });

        suggestList.mouseleave(function(e){
            hoverSuggestItems = false;
        });

        tagInput.keyup(function(e){
        	if((allowedTagsNumber == false) || (inserted.length < allowedTagsNumber)){
            	suggest($(this).val());
            }
        });

        tagInput.focusout(function(e){
            if(!hoverSuggestItems){
                suggestList.css('display', 'none');
            }
        });

        tagInput.focus(function(e){
            currentValue = null;
            if((allowedTagsNumber == false) || (inserted.length < allowedTagsNumber)){
                suggest($(this).val());
            }
        });

        tagInput.keydown(function(e){
            if(e.keyCode == keyMap.downArrow) {
                selectDown();
            }else if(e.keyCode == keyMap.upArrow) {
                selectUp()
            }else if(e.keyCode == keyMap.enter || e.keyCode == keyMap.tab) {
                checkForItem();
                // prevent default action for enter
                return e.keyCode != keyMap.enter;
            }else if(e.keyCode == keyMap.backspace){
                // backspace
                if(tagInput.val() == ''){
                    removeLastItem();
                }
                updateTagInputWidth();
            } else {
                updateTagInputWidth();
            }

        });

		if (addItemOnBlur) {
			tagInput.blur(function(e){
				checkForItem();
			});
		}

        tagList.parent().click(function(e){
            tagInput.focus();
        });

        // functions
        function setValue(){
            tagField.val(inserted.join(','));
        }

        function updateTagInputWidth()
        {
            /*
            * To make tag wrapping behave as expected, dynamically adjust
            * the tag input's width to its content's width
            * The best way to get the content's width in pixels is to add it
            * to the DOM, grab the width, then remove it from the DOM.
            */
            var temp = $("<span />").text(tagInput.val()).appendTo(inputItem);
            var width = temp.width();
            temp.remove();
            tagInput.width(width + 20);
        }

		function checkForItem(value){
			if(allowedTagsNumber != false){
				if(inserted.length >= allowedTagsNumber){
					return;
				}
			}
			if(currentItem != null){
                addItem(currentItem);
            } else if(allowNewTags){
                var value = tagInput.val();
                if(value != null && value != ''){
                    addItem(value);
                }
            }
		}

		function addItem(value){
			 addItemWithFocus(value,true);
		}

        function addItemWithFocus(value,setFocusToInputField){
            var caseInSensitiveFound = false;
            if(!caseSensitive){
				$.each(inserted,function(index, val) {
  					if (caseInSensitiveFound == false && (val.toLowerCase() == value.toLowerCase())) {
   						caseInSensitiveFound = true;
   					 	return true;
  					}
				});
            }
            var index = jQuery.inArray(value,tagstmp);
            if((jQuery.inArray(value,inserted) == -1) && ( index > -1 || allowNewTags) && !caseInSensitiveFound){
                //delete from tags
                if(index >-1){
                    tagstmp.splice(index,1);
                }
                if(settings.allowedTagsWordsNumber != false){
                    value = value.substring(0, settings.allowedTagsWordsNumber);
                }
                
                inserted.push(value);
                inputItem.before("<li class='superblyTagItem'><span>" + value + "</span><a> x</a></li>");
                tagInput.val("");
                currentValue = null;
                currentItem = null;
                // add remove click event
                var new_index = tagList.children('.superblyTagItem').size()-1;
                $(tagList.children('.superblyTagItem')[new_index]).children('a').click(function(e){
                    var value = $($(this).parent('.superblyTagItem').children('span')[0]).text();
                    removeItem(value);

                });
            }
            suggestList.css('display', 'none');
            updateTagInputWidth();
            if(setFocusToInputField){
            	tagInput.focus();
            }
            setValue();
            if((allowedTagsNumber != false) && (inserted.length >= allowedTagsNumber)){
				disableAddItem()
			}
        }

        function disableAddItem(){
        	tagInput.attr('disabled','disabled');
			suggestList.css('display','none');
        }

        function enableAddItem(){
        	tagInput.removeAttr('disabled');
			suggestList.show();
        }


        function removeItem(value){
            if(onRemove(value) === false) {
                return false;
            }
            var index = jQuery.inArray(value,tags);
            var tmpIndex = jQuery.inArray(value,tagstmp);
            if(index > -1 && tmpIndex == -1){
                tagstmp.push(value);
            }
            index = jQuery.inArray(value,inserted);
            if(index > -1){
                inserted.splice(index,1);
                tagList.children(".superblyTagItem").filter(function(){return $('span', this).html() == value;}).remove();
            }
            tagstmp.sort();
            tagInput.focus();
            setValue();
            if((allowedTagsNumber != false) && (inserted.length < allowedTagsNumber)){
				enableAddItem();
			}
            suggest(tagInput.val());
        }

        function removeLastItem(){
            var last_index = inserted.length-1;
            var last_value = inserted[last_index];
            removeItem(last_value);
        }

        function getSuggestionsArray(value){
            var suggestions = new Array();
            var count = 0;
            for(key in tagstmp){
                if(showTagsNumber <= count){
                    break;
                }
                // if beginning is same
                var lower_case_tag = tagstmp[key].toLocaleLowerCase();
                var lower_cast_value = value.toLowerCase();
                if(lower_case_tag.indexOf(lower_cast_value) == 0){
                    suggestions.push(tagstmp[key]);
                    count++;
                }
            }
            return suggestions;
        }


        function suggest(value){
            suggestList.show();
            if(value == currentValue){
                return false;
            }
            currentValue = value;
            suggestList.empty();
            var suggestions = getSuggestionsArray(value);
            for(key in suggestions){
                suggestList.append("<li class='superblySuggestItem'>" + suggestions[key] + "</li>");
            }
            var suggestionItems = suggestList.children('.superblySuggestItem');

            // add click event to suggest items
            suggestionItems.click(function(e){
                addItem($(this).html());
            });

            selectedIndex=null;
            if(!allowNewTags){
                selectedIndex=0;
                $(suggestionItems[selectedIndex]).addClass("selected");
                currentItem = $(suggestionItems[selectedIndex]).html();
            }
        }


        function selectDown(){
            var suggestions = suggestList.children('.superblySuggestItem');
            var size = suggestions.size();
            if(selectedIndex == null){
                selectedIndex=0;
            }else if(selectedIndex < size-1){
                $(suggestions[selectedIndex]).removeClass("selected");
                selectedIndex++;
            }
            $(suggestions[selectedIndex]).addClass("selected");
            currentItem = $(suggestions[selectedIndex]).html();
        }

        function selectUp(){
            if(selectedIndex == 0){
                selectedIndex=null;
                currentItem = null;
                tagInput.focus();
            } else if(selectedIndex >0){
                var suggestions = suggestList.children('.superblySuggestItem');
                $(suggestions[selectedIndex]).removeClass("selected");
                selectedIndex--;
                $(suggestions[selectedIndex]).addClass("selected");
                currentItem = $(suggestions[selectedIndex]).html();
            }
        }
    }
})(jQuery);