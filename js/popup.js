
var bc;
var projects = {};
var todoLists = {};
var todoItems = {};

var drawing = false;

$(function(){

 	try{
      var accounts = JSON.parse(localStorage.accounts);
    }catch(e){
      accounts = [];
    }


	if(accounts.length <= 0){
	
		$("body").children().remove();
		$("body").append("<h1>You need to enter credentials first. Right click on this icon and choose Options.</h1>");
		
		return;
	}


    $("#accounts").children().remove();
    for(var x = 0; x < accounts.length; x++){
    	$("#accounts").append("<option value='"+x+"'>"+accounts[x]['subdomain']+":"+accounts[x]['username']+"</option>");
    }


    $("#accounts").chosen().change(function(){
    	
		chrome.extension.sendRequest({
			action:'projects',
			data:{}
		}, refreshProjectsDropdown);

		chrome.extension.sendRequest({
			action:'priorities',
			data:{}
		}, refreshPrioritiesDropdown);

    });

    $("#projects").chosen().change(function(){
    	chrome.extension.sendRequest({
			action:'people',
			data:{projectID:$("#projects").val()}
		}, refreshPeopleDropdown);
		
		chrome.extension.sendRequest({
			action:'issues',
			data:{projectID:$("#projects").val()}
		}, refreshIssuesDropdown);
    });
	
	$("#issues").chosen().change(function(){
		chrome.extension.sendRequest({
			action:'issue',
			data:{projectID:$("#projects").val(), issueID:$("#issues").val()}
		}, refreshIssueDetailState);
	});
	
	
	$("#fixers").chosen();
	$("#testers").chosen();
	$("#priorities").chosen();
	
	chrome.extension.sendRequest({
		action:'projects',
		data:{}
	}, refreshProjectsDropdown);

	chrome.extension.sendRequest({
		action:'priorities',
		data:{}
	}, refreshPrioritiesDropdown);


  $('#markupcolor').ColorPicker({
	onSubmit: function(hsb, hex, rgb, el) {
		$(el).val(hex);
		$(el).ColorPickerHide();
	},
	onBeforeShow: function () {
		$(this).ColorPickerSetColor(this.value);
	}
  }).bind('keyup', function(){
	$(this).ColorPickerSetColor(this.value);
  });
  
  $('#markupcolor').css('backgroundColor', '#ff0000');

  $('.action-option').change(function(){
	var action = $('.action-option:checked').val();
	if(action == 'comment'){
		showCommentForm();
	}else{
		showNewIssueForm();
	}
  });
  
  $('.screenshot-option').change(function(){
	if($(this).is(":checked")){
		$("#drawing-wrapper").show();
	}else{
		$("#drawing-wrapper").hide();
	}
  });
  
  $('#drawbutton').click(function(){
	if(!drawing){
		drawing = true;
		chrome.tabs.executeScript(null, {code:"notdonedone_start_draw('"+$('#markupcolor').val()+"', '"+$('#brushsize').val()+"')"});
		$(this).val("Cancel Drawing");
	}else{
		drawing = false;
		chrome.tabs.executeScript(null, {code:"notdonedone_stop_draw()"});
		$(this).val("Start Drawing");
	}
  });
  
  $('#issue-button, #comment-button').click(function(){
	$('#issue-button, #comment-button').prop('enabled', false);
	var action = $('.action-option:checked').val();
	if(action == 'comment'){
		createComment();
	}else{
		createIssue();
	}
	
  
  });
});

chrome.extension.onRequest.addListener(handleRequest);

function handleRequest(request, sender, sendResponse){
	if(request['error']){
		statusMessage(request['error'], 'important');
	}
}

function createIssue(){
	if($('.screenshot-option').is(':checked')){
		chrome.tabs.captureVisibleTab(null, {'format':"jpeg", "quality":70}, function(data){
			chrome.tabs.getSelected(null,function(tab){
				chrome.extension.sendRequest({
					action:'create_issue',
					data:{
						projectID: $('#projects').val(),
						title:$('#title').val(),
						body:$('#body').val(),//+"\n\n"+tab.url,
						tags:"",
						priority_level_id:$('#priorities').val(),
						resolver_id:$('#fixers').val(),
						tester_id:$('#testers').val(),
						file:data
					}
				}, issuePosted);
			});
		});	
	}else{
		chrome.tabs.getSelected(null,function(tab){
			chrome.extension.sendRequest({
				action:'create_issue',
				data:{
					projectID: $('#projects').val(),
					title:$('#title').val(),
					body:$('#body').val(),//+"\n\n"+tab.url,
					tags:"",
					priority_level_id:$('#priorities').val(),
					resolver_id:$('#fixers').val(),
					tester_id:$('#testers').val()
				}
			}, issuePosted);
		});
	}
}

function createComment(){
	if($('.screenshot-option').is(':checked')){
		chrome.tabs.captureVisibleTab(null, {'format':"jpeg", "quality":70}, function(data){
			chrome.tabs.getSelected(null,function(tab){
				chrome.extension.sendRequest({
					action:'create_comment',
					data:{
						projectID: $('#projects').val(),
						issueID: $('#issues').val(),
						comment:$('#comment').val(),
						desc:$('#comment').val(),//+"\n\n"+tab.url,
						file:data
					}
				}, issuePosted);
			});
		});	
	}else{
		chrome.tabs.getSelected(null,function(tab){
			chrome.extension.sendRequest({
				action:'create_comment',
				data:{
					projectID: $('#projects').val(),
					issueID: $('#issues').val(),
					comment:$('#comment').val(),
					desc:$('#comment').val()//+"\n\n"+tab.url
				}
			}, issuePosted);
		});
	}
}


function commentPosted(data){
	statusMessage("Comment Posted", "success");
	$('#issue-button, #comment-button').prop('enabled', true);
}

function issuePosted(data){
	statusMessage("Issue Posted", "success");
	$('#issue-button, #comment-button').prop('enabled', true);
}

function showCommentForm(){
		chrome.extension.sendRequest({
			action:'people',
			data:{projectID:$("#projects").val()}
		}, refreshPeopleDropdown);
		
		chrome.extension.sendRequest({
			action:'issues',
			data:{projectID:$("#projects").val()}
		}, refreshIssuesDropdown);

	$("#issues-wrapper").show();
	$("#fixers-wrapper").hide();
	$("#priorities-wrapper").hide();
	$("#testers-wrapper").hide();
	$("#comment-wrapper").show();
	$("#issue-wrapper").hide();
	$("#screenshot-wrapper").show();
}

function showNewIssueForm(){
	$("#issues-wrapper").hide();
	$("#fixers-wrapper").show();
	$("#priorities-wrapper").show();
	$("#testers-wrapper").show();
	$("#comment-wrapper").hide();
	$("#issue-wrapper").show();
	$("#screenshot-wrapper").show();
}

function refreshProjectsDropdown(data){
	
	$("#projects").children().remove();

	$("#projects").append('<option value=""></option>');
	for(var id in data){
		$("#projects").append('<option value="'+data[id]['ID']+'">'+data[id]['Name']+'</option>');
	}
	$("#projects").trigger("liszt:updated");
	
}
function refreshPrioritiesDropdown(data){
	$("#priorities").children().remove();
	for(var id in data){
		$("#priorities").append('<option value="'+data[id]['ID']+'">'+data[id]['Value']+'</option>');
	}
	$("#priorities").trigger("liszt:updated");
}


function refreshIssuesDropdown(data){
	$('#issues').children().remove();

	$("#issues").append('<option value=""></option>');
	for(var id in data){
		$("#issues").append('<option value="'+data[id]['OrderNumber']+'">'+data[id]['Title']+'</option>');
	}
	$("#issues").trigger("liszt:updated");
}

function refreshPeopleDropdown(data){
	$('#testers').children().remove();

	for(var id in data){
		$("#testers").append('<option value="'+data[id]['ID']+'">'+data[id]['Value']+'</option>');
	}
	$("#testers").trigger("liszt:updated");
	
	$('#fixers').children().remove();

	for(var id in data){
		$("#fixers").append('<option value="'+data[id]['ID']+'">'+data[id]['Value']+'</option>');
	}
	$("#fixers").trigger("liszt:updated");
	
}

function refreshIssueDetailState(data){
	$("#priorities").val(data.PriorityLevelID);
	$("#fixers").val(data.Resolver.ID);
	$("#testers").val(data.Tester.ID);
}

function statusMessage(message, type){
	if(!type) type = "notice";
	var alrt = $("<div style='display:none'><span class='label "+type+"'>"+type+"</span> "+htmlspecialchars(message)+"</div>");
	$("#status").append(alrt);
	alrt.fadeIn(200);
	
	$("#status-clear").show();
}